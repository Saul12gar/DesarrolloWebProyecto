import React, { createContext, useContext, useState, useEffect } from "react";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
// Definir roles y permisos
export const ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  USER: "user",
};

export const PERMISSIONS = {
  // Admin permissions
  MANAGE_USERS: "manage_users",
  VIEW_ADMIN_PANEL: "view_admin_panel",
  EDIT_PRODUCTS: "edit_products",
  DELETE_PRODUCTS: "delete_products",

  // Editor permissions
  CREATE_PRODUCTS: "create_products",
  EDIT_OWN_PRODUCTS: "edit_own_products",

  // User permissions
  VIEW_PRODUCTS: "view_products",
  BUY_PRODUCTS: "buy_products",
  MANAGE_OWN_PROFILE: "manage_own_profile",
};

// Mapear roles a permisos
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_ADMIN_PANEL,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.DELETE_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.EDIT_OWN_PRODUCTS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.BUY_PRODUCTS,
    PERMISSIONS.MANAGE_OWN_PROFILE,
  ],
  [ROLES.EDITOR]: [
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.EDIT_OWN_PRODUCTS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.BUY_PRODUCTS,
    PERMISSIONS.MANAGE_OWN_PROFILE,
  ],
  [ROLES.USER]: [
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.BUY_PRODUCTS,
    PERMISSIONS.MANAGE_OWN_PROFILE,
  ],
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar sesión al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/api/me`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Función para verificar si el usuario tiene un permiso
  const hasPermission = (permission) => {
    if (!user || !user.role) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(permission) || false;
  };

  // Función para verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Función para verificar si el usuario tiene alguno de los roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  // Login function
  const login = async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && !data.requireMfa) {
        // Login exitoso sin MFA
        setUser(data.user);
        return { success: true, user: data.user };
      } else if (data.requireMfa) {
        // Requiere MFA
        return { success: true, requireMfa: true, username: data.username };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: "Error de conexión" };
    }
  };

  // Verify MFA
  const verifyMfa = async (email, otp) => {
    try {
      const response = await fetch(`${API_URL}/api/verify-mfa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: "Error verificando MFA" };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const value = {
    user,
    loading,
    login,
    verifyMfa,
    logout,
    hasPermission,
    hasRole,
    hasAnyRole,
    ROLES,
    PERMISSIONS,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
