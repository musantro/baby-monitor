import useSettings from "../custom-hooks/useSettings";
import SettingsForm from "./SettingsForm";

interface SettingsProps {
  showToast: (message: string) => void;
}

function Settings({ showToast }: SettingsProps) {
  const settings = useSettings(showToast);
  return (
    <SettingsForm
      settings={settings.settings}
      onChange={settings.setSettings}
      onReset={settings.reset}
      onSave={settings.save}
    />
  );
}

export default Settings;
