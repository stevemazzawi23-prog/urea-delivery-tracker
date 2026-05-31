import { ONE_YEAR_MS, COOKIE_NAME } from "../../shared/const.js";
import type { Express, Request, Response } from "express";
import { getUserByOpenId, upsertUser, getDriverAccountByUsername } from "../db";
import { getUserByUsername as getPortalUserByUsername } from "../db-portal";
import bcrypt from "bcryptjs";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

async function syncUser(userInfo: {
  openId?: string | null;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  platform?: string | null;
}) {
  if (!userInfo.openId) {
    throw new Error("openId missing from user info");
  }

  const lastSignedIn = new Date();
  await upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email ?? null,
    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
    lastSignedIn,
  });
  const saved = await getUserByOpenId(userInfo.openId);
  return (
    saved ?? {
      openId: userInfo.openId,
      name: userInfo.name,
      email: userInfo.email,
      loginMethod: userInfo.loginMethod ?? null,
      lastSignedIn,
    }
  );
}

function buildUserResponse(
  user:
    | Awaited<ReturnType<typeof getUserByOpenId>>
    | {
        openId: string;
        name?: string | null;
        email?: string | null;
        loginMethod?: string | null;
        lastSignedIn?: Date | null;
      },
) {
  return {
    id: (user as any)?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
  };
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      await syncUser(userInfo);
      const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      const frontendUrl =
        process.env.EXPO_WEB_PREVIEW_URL ||
        process.env.EXPO_PACKAGER_PROXY_URL ||
        "http://localhost:8081";
      res.redirect(302, frontendUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });

  app.get("/api/oauth/mobile", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      const user = await syncUser(userInfo);

      const sessionToken = await sdk.createSessionToken(userInfo.openId!, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        app_session_id: sessionToken,
        user: buildUserResponse(user),
      });
    } catch (error) {
      console.error("[OAuth] Mobile exchange failed", error);
      res.status(500).json({ error: "OAuth mobile exchange failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error);
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });

  app.post("/api/auth/session", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);

      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      const token = authHeader.slice("Bearer ".length).trim();

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/session failed:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // ============================================================
  // DRIVER LOGIN - Custom authentication for SP Logistix drivers
  // ============================================================
  // Supports login via:
  // 1. Portal users table (users with passwordHash set)
  // 2. driverAccounts table (legacy)
  app.post("/api/auth/driver-login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: "username and password are required" });
        return;
      }

      let openId: string;
      let userName: string;
      let userRole: string = "user";

      // Try portal users table first (login by name field)
      const portalUser = await getPortalUserByUsername(username);

      if (portalUser && portalUser.passwordHash) {
        // Verify password using bcrypt (portal stores hashed passwords)
        const passwordValid = await bcrypt.compare(password, portalUser.passwordHash);
        if (!passwordValid) {
          res.status(401).json({ error: "Identifiants incorrects" });
          return;
        }
        openId = portalUser.openId || `portal:${portalUser.id}`;
        userName = portalUser.name || username;
        userRole = portalUser.role || "user";

        // Ensure user exists in local users table for session management
        await upsertUser({
          openId,
          name: userName,
          email: portalUser.email || null,
          loginMethod: "driver",
          lastSignedIn: new Date(),
          role: userRole,
        });
      } else {
        // Fallback: try driverAccounts table
        const driverAccount = await getDriverAccountByUsername(username);

        if (!driverAccount) {
          res.status(401).json({ error: "Identifiants incorrects" });
          return;
        }

        if (!driverAccount.isActive) {
          res.status(401).json({ error: "Compte désactivé" });
          return;
        }

        const storedHash = driverAccount.passwordHash;
        const passwordValid = storedHash === password;

        if (!passwordValid) {
          res.status(401).json({ error: "Identifiants incorrects" });
          return;
        }

        openId = `driver:${driverAccount.id}`;
        userName = driverAccount.username;
        userRole = driverAccount.role === "admin" ? "admin" : "user";

        await upsertUser({
          openId,
          name: driverAccount.username,
          email: null,
          loginMethod: "driver",
          lastSignedIn: new Date(),
          role: userRole,
        });
      }

      // Get the user record
      const user = await getUserByOpenId(openId);

      // Create JWT session token
      const sessionToken = await sdk.signSession(
        {
          openId,
          appId: process.env.VITE_APP_ID ?? "sp-logistix",
          name: userName,
        },
        { expiresInMs: ONE_YEAR_MS },
      );

      // Set cookie for web
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        token: sessionToken,
        user: {
          id: user?.id ?? 0,
          openId,
          username: userName,
          role: userRole,
          name: userName,
        },
      });
    } catch (error) {
      console.error("[Auth] Driver login failed:", error);
      res.status(500).json({ error: "Erreur serveur lors de la connexion" });
    }
  });
}
