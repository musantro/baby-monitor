import {
  defaultSettings,
  getBrowserID,
  getSettings,
  isChanged,
  resetSettings,
  setSettings,
} from "../../src/services/settings";

beforeEach(() => localStorage.clear());

describe("settings storage service", () => {
  test("creates and reuses a browser ID", () => {
    const id = getBrowserID();
    expect(getBrowserID()).toBe(id);
  });

  test("creates, saves, normalizes and resets settings", () => {
    expect(getSettings()).toEqual(defaultSettings);
    setSettings({ ...defaultSettings, pollingTimeout: 8, trustedParents: [1] });
    expect(getSettings().pollingTimeout).toBe(8);
    expect(isChanged({ ...getSettings(), pollingTimeout: 2 })).toBe(true);
    expect(isChanged(getSettings())).toBe(false);
    resetSettings();
    expect(getSettings()).toEqual({ ...defaultSettings, trustedParents: [1] });
  });

  test("ignores non-object settings", () => {
    expect(() => setSettings("invalid")).toThrow("Settings are required");
    expect(localStorage.getItem("baby-monitor-settings")).toBeNull();
  });
});
