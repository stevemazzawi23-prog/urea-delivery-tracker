import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logAuditAction } from "./audit-logger";

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
  users: User[];
  createUser: (username: string, password: string, role: UserRole) => Promise<boolean>;
  updateUser: (id: string, username: string, password: string, role: UserRole) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  refreshUsers: () => Promise<void>;
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

const ALL_USERS_KEY = "urea_all_users";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  // Initialize users and check session on first load
  useEffect(() => {
    const init = async () => {
      await initializeUsers();
      await loadAllUsers();
      await checkSession();
    };
    init();
  }, []);

  const initializeUsers = async () => {
    try {
      const existingUsers = await AsyncStorage.getItem(ALL_USERS_KEY);
      if (!existingUsers) {
        // Store default users with passwords (for demo purposes)
        await AsyncStorage.setItem(ALL_USERS_KEY, JSON.stringify(DEFAULT_USERS));
      }
    } catch (error) {
      console.error("Error initializing users:", error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const allUsersData = await AsyncStorage.getItem(ALL_USERS_KEY);
      if (allUsersData) {
        const allUsers = JSON.parse(allUsersData);
        setUsers(allUsers);
      }
    } catch (error) {
      console.error("Error loading users:", error);
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
          await logAuditAction(
            userObj.id,
            userObj.username,
            userObj.role,
            "LOGIN",
            undefined,
            undefined,
            undefined,
            {},
            "success"
          );
        } catch (storageError) {
          console.error("Error storing session:", storageError);
        }
        return true;
      }
      await logAuditAction(
        "unknown",
        username,
        "driver",
        "LOGIN",
        undefined,
        undefined,
        undefined,
        {},
        "failure",
        "Invalid credentials"
      );
      return false;
    } catch (error) {
      console.error("Error during login:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      if (user) {
        await logAuditAction(
          user.id,
          user.username,
          user.role,
          "LOGOUT",
          undefined,
          undefined,
          undefined,
          {},
          "success"
        );
      }
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

  const createUser = async (username: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      // Check if username already exists
      if (users.some((u) => u.username === username)) {
        console.error("Username already exists");
        return false;
      }

      const newUser: any = {
        id: Date.now().toString(),
        username,
        password,
        role,
      };

      const updatedUsers = [...users, newUser];
      await AsyncStorage.setItem(ALL_USERS_KEY, JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      return true;
    } catch (error) {
      console.error("Error creating user:", error);
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
      // Check if username already exists (excluding current user)
      if (users.some((u) => u.id !== id && u.username === username)) {
        console.error("Username already exists");
        return false;
      }

      const updatedUsers = users.map((u) =>
        u.id === id ? { ...u, username, password, role } : u
      );

      await AsyncStorage.setItem(ALL_USERS_KEY, JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      return true;
    } catch (error) {
      console.error("Error updating user:", error);
      return false;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      // Prevent deleting the admin user
      if (id === "1") {
        console.error("Cannot delete admin user");
        return false;
      }

      const updatedUsers = users.filter((u) => u.id !== id);
      await AsyncStorage.setItem(ALL_USERS_KEY, JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  };

  const refreshUsers = async () => {
    await loadAllUsers();
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
