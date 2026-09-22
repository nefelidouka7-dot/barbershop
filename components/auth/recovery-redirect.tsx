"use client";

import { useEffect } from "react";

/** Recovery emails land on Site URL with #access_token&type=recovery */
export function RecoveryRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { hash, pathname } = window.location;
    if (!hash.includes("type=recovery")) return;
    if (pathname.startsWith("/auth/reset")) return;
    window.location.replace(`/auth/reset${hash}`);
  }, []);

  return null;
}
