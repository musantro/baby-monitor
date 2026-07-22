import type { Settings } from "./types";

export const defaultSettings: Readonly<Settings> = Object.freeze({
  startWithFrontCamera: true,
  maxParentConnections: 3,
  pollingTimeout: 5,
  restartPolling: true,
  usePushToTalk: true,
  trustedParents: [],
});

export function normalizeSettings(settings: Partial<Settings> | null = {}): Settings {
  const safeSettings = settings ?? {};
  return {
    ...defaultSettings,
    ...safeSettings,
    trustedParents: Array.isArray(safeSettings.trustedParents) ? safeSettings.trustedParents : [],
  };
}

export function haveSettingsChanged(nextSettings: Settings, currentSettings: Settings): boolean {
  return (
    JSON.stringify(normalizeSettings(nextSettings)) !==
    JSON.stringify(normalizeSettings(currentSettings))
  );
}
