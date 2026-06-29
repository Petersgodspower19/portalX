"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/app/_lib/AuthContext";
import { getDefaultRoute } from "@/app/_lib/permissions";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.must_change_password) {
      router.replace("/change-password");
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      router.replace(getDefaultRoute(user.role));
    }
  }, [user, isLoading, allowedRoles, router]);

  if (isLoading) return null;
  if (!user || user.must_change_password || !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}