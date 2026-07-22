import { useNavigate } from "react-router-dom";
import { useTranslation } from "../i18n";

export default function Help() {
  const t = useTranslation();
  const navigate = useNavigate();
  return (
    <main className="help-page">
      <h1>{t("help.title")}</h1>
      <p>{t("help.intro")}</p>
      <h2>{t("help.quickStart")}</h2>
      <ol>
        <li>{t("help.step1")}</li>
        <li>{t("help.step2Before")} <strong>{t("help.step2Action")}</strong> {t("help.step2After")}</li>
        <li>{t("help.step3Before")} <strong>{t("help.step3Action")}</strong> {t("help.step3After")}</li>
      </ol>
      <h2>{t("help.security")}</h2>
      <ul>
        <li>{t("help.peerToPeer")}</li>
        <li>{t("help.signalingBefore")} <code>/api/v1/exchange</code>.</li>
        <li>{t("help.firewall")}</li>
      </ul>
      <button className="link-button" onClick={() => navigate("/")}>{t("help.back")}</button>
    </main>
  );
}
