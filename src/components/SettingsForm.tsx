import NumberInput from "./NumberInput";
import ToggleSwitch from "./ToggleSwitch";
import type { PropsWithChildren } from "react";
import type { Settings } from "../domain/types";
import { useTranslation } from "../i18n";

interface SettingsFormProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onReset: () => void;
  onSave: () => void;
}

function SettingsForm({ settings, onChange, onReset, onSave }: SettingsFormProps) {
  const t = useTranslation();
  const update = <Key extends keyof Settings>(key: Key, value: Settings[Key]) =>
    onChange({ ...settings, [key]: value });

  return (
    <div className="container-y" style={styles.container}>
      <div className="text-title" style={{ marginBottom: "1.5em" }}>
        {t("settings.title")}
      </div>
      <Setting label={t("settings.frontCamera")} id="startWithFrontCamera">
        <ToggleSwitch
          id="startWithFrontCamera"
          checked={settings.startWithFrontCamera}
          onChange={(value) => update("startWithFrontCamera", value)}
        />
      </Setting>
      <Setting label={t("settings.maxParents")} id="maxParentConnections">
        <NumberInput
          id="maxParentConnections"
          min={1}
          max={5}
          value={settings.maxParentConnections}
          onChange={(value) => update("maxParentConnections", value)}
        />
      </Setting>
      <Setting label={t("settings.pollingTimeout")} id="pollingTimeout">
        <NumberInput
          id="pollingTimeout"
          min={1}
          max={15}
          value={settings.pollingTimeout}
          onChange={(value) => update("pollingTimeout", value)}
        />
      </Setting>
      <Setting label={t("settings.restartPolling")} id="restartPolling">
        <ToggleSwitch
          id="restartPolling"
          checked={settings.restartPolling}
          onChange={(value) => update("restartPolling", value)}
        />
      </Setting>
      <Setting label={t("settings.pushToTalk")} id="usePushToTalk">
        <ToggleSwitch
          id="usePushToTalk"
          checked={settings.usePushToTalk}
          onChange={(value) => update("usePushToTalk", value)}
        />
      </Setting>
      <Setting label={t("settings.timestamp")} id="showVideoTimestamp">
        <ToggleSwitch
          id="showVideoTimestamp"
          checked={settings.showVideoTimestamp}
          onChange={(value) => update("showVideoTimestamp", value)}
        />
      </Setting>
      <div className="container-x setting">
        <label style={{ fontSize: "large" }}>
          {t("settings.trustedParents")} <strong>({settings.trustedParents.length})</strong>
        </label>
        <input
          type="button"
          className="button"
          style={styles.forgetButton}
          value={t("settings.forgetAll")}
          disabled={settings.trustedParents.length === 0}
          onClick={() => update("trustedParents", [])}
        />
      </div>
      <div className="container-x" style={styles.actions}>
        <button onClick={onSave} className="button">
          {t("settings.save")}
        </button>
        <button onClick={onReset} className="button">
          {t("settings.restore")}
        </button>
      </div>
    </div>
  );
}

function Setting({ label, id, children }: PropsWithChildren<{ label: string; id: string }>) {
  return (
    <div className="container-x setting">
      <label htmlFor={id} style={{ fontSize: "large" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const styles = {
  container: {
    margin: "0em 0.5em",
    padding: "0em",
    height: "90vh",
    justifyContent: "center",
    alignItems: "center",
  },
  forgetButton: { width: "auto", height: "40px", margin: "0", padding: "0px 1em" },
  actions: { width: "100%", gap: "1em", marginTop: "1.75em" },
};

export default SettingsForm;
