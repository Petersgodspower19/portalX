"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDefaultRoute } from "../_lib/permissions";
import { getCurrentUserProfile } from "../_lib/auth";
import { toast } from "react-toastify";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setIsLoading(false);
          return;
        }
        const data = await getCurrentUserProfile();
        setUser(data);
        if (data?.must_change_password) router.push("/change-password");
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMe();
  }, []);

  const login = async (token, userData, refreshToken) => {
    localStorage.setItem("token", token);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);

    // userData from the login response is partial (role, must_change_password) —
    // fetch the full profile so first_name/last_name etc. are available immediately,
    // without needing a reload.
    let fullUser = userData;
    try {
      const profile = await getCurrentUserProfile();
      if (profile) fullUser = { ...userData, ...profile };
    } catch {
      // fall back to the partial userData if /auth/me fails for some reason
    }

    setUser(fullUser);
    toast.success(`Login successful, Welcome, ${fullUser.first_name}!`);
    if (fullUser.must_change_password) {  
      router.push("/change-password");
    } else {
      router.push(getDefaultRoute(fullUser.role));
    }
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout: logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};