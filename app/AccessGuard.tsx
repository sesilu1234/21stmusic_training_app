"use client";

import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AccessGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/login" || pathname.startsWith("/api/auth")) return;

    let cancelled = false;
    let isSigningOut = false;

    const checkAccess = async () => {
      try {
        const response = await fetch("/api/access-check", {
          cache: "no-store",
        });

        if (!cancelled && !response.ok && !isSigningOut) {
          isSigningOut = true;
          await signOut({ callbackUrl: "/login?error=AccessDenied" });
        }
      } catch {
        // If the network briefly fails, keep the current session and retry later.
      }
    };

    void checkAccess();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
