import { useCallback, useEffect } from "react";
import { getSettings, isChanged, resetSettings, setSettings } from "../services/settings";
import useRefState from "./useRefState";

export default function useSettings(showToast: (message: string) => void) {
  const [settings, setSettingsState, getSettingsState] = useRefState(getSettings());

  const save = useCallback(() => {
    const settingsToSave = getSettingsState();
    if (!isChanged(settingsToSave)) {
      showToast("Settings not changed!");
      return;
    }
    setSettings(settingsToSave);
    showToast("Settings saved!");
  }, [getSettingsState, showToast]);

  const reset = useCallback(() => {
    resetSettings();
    setSettingsState(getSettings());
    showToast("Restored default settings!");
  }, [setSettingsState, showToast]);

  useEffect(() => save, [save]);

  return { settings, setSettings: setSettingsState, getSettings: getSettingsState, reset, save };
}
