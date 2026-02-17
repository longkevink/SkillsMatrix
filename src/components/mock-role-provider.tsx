"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MOCK_ROLE_COOKIE_NAME } from "@/src/lib/constants";
import type { MockRole } from "@/src/lib/types";
import { parseMockRole } from "@/src/lib/mock-role";

interface MockRoleContextValue {
  mockRole: MockRole;
  setMockRole: (role: MockRole) => void;
}

const MockRoleContext = createContext<MockRoleContextValue | null>(null);

interface MockRoleProviderProps {
  initialRole: MockRole;
  children: React.ReactNode;
}

export function MockRoleProvider({ initialRole, children }: MockRoleProviderProps) {
  const [mockRole, setMockRoleState] = useState<MockRole>(() => {
    if (typeof window === "undefined") {
      return initialRole;
    }

    return parseMockRole(window.localStorage.getItem(MOCK_ROLE_COOKIE_NAME));
  });

  useEffect(() => {
    window.localStorage.setItem(MOCK_ROLE_COOKIE_NAME, mockRole);
    document.cookie = `${MOCK_ROLE_COOKIE_NAME}=${encodeURIComponent(mockRole)}; path=/; max-age=31536000; SameSite=Lax`;
  }, [mockRole]);

  const setMockRole = (role: MockRole) => {
    setMockRoleState(role);
  };

  const value = useMemo(() => ({ mockRole, setMockRole }), [mockRole]);

  return <MockRoleContext.Provider value={value}>{children}</MockRoleContext.Provider>;
}

export function useMockRole() {
  const ctx = useContext(MockRoleContext);

  if (!ctx) {
    throw new Error("useMockRole must be used inside MockRoleProvider");
  }

  return ctx;
}
