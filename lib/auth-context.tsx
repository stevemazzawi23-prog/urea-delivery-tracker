import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserRole = "admin" | "driver";

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = "urea_users";
const SESSION_KEY = "urea_session";

// Log for debugging
if (typeof window !== 'undefined') {
  console.log('[Auth] AuthProvider initialized');
}

// Default users - admin and one driver
const DEFAULT_USERS = [
  { id: "1", username: "admin", password: "admin123", role: "admin" as UserRole },
  { id: "2", username: "driver1", password: "driver123", role: "driver" as UserRole },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize users and check session on first load
  useEffect(() => {
    const init = async () => {
      await initializeUsers();
      await checkSession();
    };
    init();
  }, []);

  const initializeUsers = async () => {
    try {
      const existingUsers = await AsyncStorage.getItem(USERS_KEY);
      if (!existingUsers) {
        // Store default users without passwords
        const usersToStore = DEFAULT_USERS.map(({ password, ...user }) => user);
        await AsyncStorage.setItem(USERS_KEY, JSON.stringify(usersToStore));
      }
    } catch (error) {
      console.error("Error initializing users:", error);
    }
  };

  const checkSession = async () => {
    try {
      const sessionData = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          setUser(session);
        } catch (parseError) {
          console.error("Error parsing session:", parseError);
          await AsyncStorage.removeItem(SESSION_KEY);
        }
      }
    } catch (error) {
      console.error("Error checking session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Find user with matching credentials
      const foundUser = DEFAULT_USERS.find(
        (u) => u.username === username && u.password === password
      );

      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser;
        const userObj = userWithoutPassword as User;
        setUser(userObj);
        try {
          await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(userObj));
        } catch (storageError) {
          console.error("Error storing session:", storageError);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error during login:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      try {
        await AsyncStorage.removeItem(SESSION_KEY);
      } catch (storageError) {
        console.error("Error removing session:", storageError);
      }
    } catch (error) {
      console.error("Error during logout:", error);
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
