function parseBooleanFlag(value: string | undefined, fallback: boolean): boolean {
  if (value == null) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

const defaultEnabledInDev = process.env.NODE_ENV !== "production";

export const premiumDashboardEnabled = parseBooleanFlag(
  process.env.NEXT_PUBLIC_PREMIUM_DASHBOARD_ENABLED,
  defaultEnabledInDev
);

export const premiumOperationsEnabled = parseBooleanFlag(
  process.env.NEXT_PUBLIC_PREMIUM_OPERATIONS_ENABLED,
  defaultEnabledInDev
);

export const uiFeatureFlags = {
  premiumDashboardEnabled,
  premiumOperationsEnabled,
} as const;
