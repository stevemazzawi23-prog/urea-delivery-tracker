import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";

export type UserRole = "admin" | "driver";

export interface User {
  id: string;
  username: string;
  role: UserRole;
  token?: string; // JWT token for API calls
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  users: User[];
  createUser: (username: string, password: string, role: UserRole) => Promise<boolean>;
  updateUser: (id: string, username: string, password: string, role: UserRole) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = "urea_session_v2";
const TOKEN_KEY = "urea_api_token";

// ============================================================
// Token storage helpers (SecureStore on native, AsyncStorage on web)
// ============================================================
async function storeToken(token: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error("[Auth] Failed to store token:", error);
  }
}

async function getStoredToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error("[Auth] Failed to get token:", error);
    return null;
  }
}

async function clearToken(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error("[Auth] Failed to clear token:", error);
  }
}

// ============================================================
// Export token getter for use in storage.ts API calls
// ============================================================
export async function getAuthToken(): Promise<string | null> {
  return getStoredToken();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  // On mount: clear any old session (require fresh login every time)
  useEffect(() => {
    const init = async () => {
      // Always clear session on startup - user must log in every time
      await AsyncStorage.removeItem(SESSION_KEY);
      await clearToken();
      setIsLoading(false);
    };
    init();
  }, []);

  // ============================================================
  // LOGIN - Calls VPS API endpoint
  // ============================================================
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const apiBase = getApiBaseUrl();
      const loginUrl = `${apiBase}/api/auth/driver-login`;

      console.log("[Auth] Attempting login to:", loginUrl);

      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur réseau" }));
        console.error("[Auth] Login failed:", errorData);
        // Try local fallback
        return await loginLocal(username, password);
      }

      const data = await response.json();

      if (!data.success || !data.token) {
        console.error("[Auth] Login response missing token:", data);
        return false;
      }

      const userObj: User = {
        id: String(data.user.id),
        username: data.user.username,
        role: data.user.role === "admin" ? "admin" : "driver",
        token: data.token,
      };

      // Store session and token
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
      await storeToken(data.token);

      setUser(userObj);
      console.log("[Auth] Login successful:", userObj.username, userObj.role);
      return true;
    } catch (error) {
      console.error("[Auth] Login error:", error);
      // Fallback: try local credentials if API is unreachable
      return await loginLocal(username, password);
    }
  };

  // ============================================================
  // LOCAL FALLBACK LOGIN (when VPS is unreachable)
  // ============================================================
  const loginLocal = async (username: string, password: string): Promise<boolean> => {
    console.warn("[Auth] API unreachable, trying local fallback login");

    const LOCAL_CREDENTIALS = [
      { id: "1", username: "admin", password: "admin123", role: "admin" as UserRole },
      { id: "2", username: "driver1", password: "driver123", role: "driver" as UserRole },
    ];

    const found = LOCAL_CREDENTIALS.find(
      (u) => u.username === username && u.password === password
    );

    if (found) {
      const { password: _, ...userObj } = found;
      setUser(userObj);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
      console.log("[Auth] Local fallback login successful");
      return true;
    }

    return false;
  };

  // ============================================================
  // LOGOUT
  // ============================================================
  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem(SESSION_KEY);
      await clearToken();
      console.log("[Auth] Logged out successfully");
    } catch (error) {
      console.error("[Auth] Logout error:", error);
    }
  };

  // ============================================================
  // USER MANAGEMENT (admin only - calls VPS API)
  // ============================================================

  const refreshUsers = async () => {
    // For now, return empty list - admin user management is done via VPS
    setUsers([]);
  };

  const createUser = async (username: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const token = await getStoredToken();
      if (!token) return false;

      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/trpc/admin.createDriverAccount`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          json: {
            username,
            passwordHash: password,
            role,
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("[Auth] Create user error:", error);
      return false;
    }
  };

  const updateUser = async (
    id: string,
    username: string,
    password: string,
    role: UserRole
  ): Promise<boolean> => {
    try {
      const token = await getStoredToken();
      if (!token) return false;

      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/trpc/admin.updateDriverAccount`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          json: {
            driverAccountId: parseInt(id),
            username,
            passwordHash: password,
            role,
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("[Auth] Update user error:", error);
      return false;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      const token = await getStoredToken();
      if (!token) return false;

      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/api/trpc/admin.deleteDriverAccount`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          json: {
            driverAccountId: parseInt(id),
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("[Auth] Delete user error:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: user !== null,
        users,
        createUser,
        updateUser,
        deleteUser,
        refreshUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function useAuthAdmin() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthAdmin must be used within AuthProvider");
  }
  return context;
}
