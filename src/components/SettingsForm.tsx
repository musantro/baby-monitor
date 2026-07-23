import NumberInput from "./NumberInput";
import ToggleSwitch from "./ToggleSwitch";
import type { PropsWithChildren } from "react";
import type { Settings } from "../domain/types";
import { useTranslation } from "../i18n";
import AppHeader from "./AppHeader";

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
    <div className="app-page">
      <AppHeader back />
      <main className="settings-page">
      <div className="page-heading">
        <span className="eyebrow">{t("settings.preferences")}</span>
        <h1>{t("settings.title")}</h1>
        <p>{t("settings.subtitle")}</p>
      </div>
      <section className="settings-card">
      <Setting label={t("settings.frontCamera")} description={t("settings.frontCameraHint")} id="startWithFrontCamera">
        <ToggleSwitch
          id="startWithFrontCamera"
          checked={settings.startWithFrontCamera}
          onChange={(value) => update("startWithFrontCamera", value)}
        />
      </Setting>
      <Setting label={t("settings.maxParents")} description={t("settings.maxParentsHint")} id="maxParentConnections">
        <NumberInput
          id="maxParentConnections"
          min={1}
          max={5}
          value={settings.maxParentConnections}
          onChange={(value) => update("maxParentConnections", value)}
        />
      </Setting>
      <Setting label={t("settings.pollingTimeout")} description={t("settings.pollingTimeoutHint")} id="pollingTimeout">
        <NumberInput
          id="pollingTimeout"
          min={1}
          max={15}
          value={settings.pollingTimeout}
          onChange={(value) => update("pollingTimeout", value)}
        />
      </Setting>
      <Setting label={t("settings.restartPolling")} description={t("settings.restartPollingHint")} id="restartPolling">
        <ToggleSwitch
          id="restartPolling"
          checked={settings.restartPolling}
          onChange={(value) => update("restartPolling", value)}
        />
      </Setting>
      <Setting label={t("settings.pushToTalk")} description={t("settings.pushToTalkHint")} id="usePushToTalk">
        <ToggleSwitch
          id="usePushToTalk"
          checked={settings.usePushToTalk}
          onChange={(value) => update("usePushToTalk", value)}
        />
      </Setting>
      <Setting label={t("settings.timestamp")} description={t("settings.timestampHint")} id="showVideoTimestamp">
        <ToggleSwitch
          id="showVideoTimestamp"
          checked={settings.showVideoTimestamp}
          onChange={(value) => update("showVideoTimestamp", value)}
        />
      </Setting>
      <div className="setting">
        <div className="setting-copy">
        <label>
          {t("settings.trustedParents")} <strong>({settings.trustedParents.length})</strong>
        </label>
        <small>{t("settings.trustedParentsHint")}</small>
        </div>
        <input
          type="button"
          className="compact-button danger-text"
          value={t("settings.forgetAll")}
          disabled={settings.trustedParents.length === 0}
          onClick={() => update("trustedParents", [])}
        />
      </div>
      </section>
      <div className="settings-actions">
        <button onClick={onSave} className="button">
          {t("settings.save")}
        </button>
        <button onClick={onReset} className="button button-secondary">
          {t("settings.restore")}
        </button>
      </div>
      </main>
    </div>
  );
}

function Setting({ label, description, id, children }: PropsWithChildren<{ label: string; description: string; id: string }>) {
  return (
    <div className="setting">
      <div className="setting-copy">
        <label htmlFor={id}>{label}</label>
        <small>{description}</small>
      </div>
      {children}
    </div>
  );
}

export default SettingsForm;
