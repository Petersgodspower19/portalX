"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./_lib/AuthContext";
import { getDefaultRoute } from "./_lib/permissions";
import { LuLoader } from "react-icons/lu";

export default function HomePage() {
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

    router.replace(getDefaultRoute(user.role));
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F4]">
      <div className="flex flex-col items-center gap-3">
        <LuLoader
          size={32}
          className="animate-spin text-[#9C7A3C]"
        />
        <p className="text-sm text-[#5C7080]">
         PortalX is Loading..
        </p>
      </div>
    </div>
  );
}