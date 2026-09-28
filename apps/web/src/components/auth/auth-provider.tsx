"use client";

import { createContext, useContext } from "react";
import type { SessionUser } from "@/lib/api";

const AuthContext = createContext<SessionUser | null>(null);

export function AuthProvider({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth(): SessionUser | null {
  return useContext(AuthContext);
}
