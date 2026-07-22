import { useCallback, useEffect } from "react";
import { getSettings, isChanged, resetSettings, setSettings } from "../services/settings";
import useRefState from "./useRefState";
import { useTranslation } from "../i18n";

export default function useSettings(showToast: (message: string) => void) {
  const t = useTranslation();
  const [settings, setSettingsState, getSettingsState] = useRefState(getSettings());

  const save = useCallback(() => {
    const settingsToSave = getSettingsState();
    if (!isChanged(settingsToSave)) {
      showToast(t("settings.unchanged"));
      return;
    }
    setSettings(settingsToSave);
    showToast(t("settings.saved"));
  }, [getSettingsState, showToast, t]);

  const reset = useCallback(() => {
    resetSettings();
    setSettingsState(getSettings());
    showToast(t("settings.restored"));
  }, [setSettingsState, showToast, t]);

  useEffect(() => save, [save]);

  return { settings, setSettings: setSettingsState, getSettings: getSettingsState, reset, save };
}
