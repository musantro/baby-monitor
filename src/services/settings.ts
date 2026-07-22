import { defaultSettings, haveSettingsChanged, normalizeSettings } from "../domain/settings";
import type { Settings } from "../domain/types";
import { DomainError } from "../domain/types";

const BROWSER_ID_KEY = "baby-monitor-browser-id";
const SETTINGS_KEY = "baby-monitor-settings";

export { defaultSettings };

export function getBrowserID() {
  const storedId = localStorage.getItem(BROWSER_ID_KEY);
  let browserID: number | null = storedId === null ? null : JSON.parse(storedId) as number;
  if (!browserID) {
    browserID = Date.now();
    localStorage.setItem(BROWSER_ID_KEY, JSON.stringify(browserID));
  }
  return browserID;
}

export function getSettings(): Settings {
  const storedSettingsJson = localStorage.getItem(SETTINGS_KEY);
  const storedSettings: Partial<Settings> | null = storedSettingsJson === null ? null : JSON.parse(storedSettingsJson) as Partial<Settings>;
  const settings = normalizeSettings(storedSettings);
  if (!storedSettings || haveSettingsChanged(settings, normalizeSettings(storedSettings))) setSettings(settings);
  return settings;
}

export function setSettings(settings: Settings): void {
  if (!settings || typeof settings !== "object") throw new DomainError("Settings are required");
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function isChanged(userSettings: Settings, currSettings: Settings = getSettings()): boolean {
  return haveSettingsChanged(userSettings, currSettings);
}

export function resetSettings() {
  setSettings({ ...defaultSettings, trustedParents: getSettings().trustedParents });
}
