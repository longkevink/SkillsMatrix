import { MOCK_ROLES } from "./constants";
import type { MockRole } from "./types";

export function parseMockRole(value: string | undefined | null): MockRole {
  if (value && MOCK_ROLES.includes(value as MockRole)) {
    return value as MockRole;
  }

  return (process.env.APP_MOCK_ROLE_DEFAULT as MockRole) || "Read Only";
}

export function canEdit(mockRole: MockRole) {
  return mockRole === "Manager" || mockRole === "Admin";
}

export function canViewNotes(mockRole?: MockRole) {
  void mockRole;
  // Currently notes are always visible if the function is called, 
  // but we accept the role for consistency with canEdit.
  return true;
}
