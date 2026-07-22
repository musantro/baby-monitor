import { defaultSettings, haveSettingsChanged, normalizeSettings } from "../../src/domain/settings";

describe("settings domain", () => {
  test("normalizes missing and malformed settings", () => {
    expect(normalizeSettings()).toEqual(defaultSettings);
    expect(normalizeSettings({ maxParentConnections: 5, trustedParents: "wrong" })).toEqual({
      ...defaultSettings,
      maxParentConnections: 5,
      trustedParents: [],
    });
  });

  test("compares normalized settings", () => {
    expect(haveSettingsChanged({}, defaultSettings)).toBe(false);
    expect(haveSettingsChanged({ ...defaultSettings, pollingTimeout: 10 }, defaultSettings)).toBe(
      true,
    );
  });
});
