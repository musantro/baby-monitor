import { CircleQuestionMark, Settings, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePWAInstaller } from "../custom-hooks/usePWAInstaller";
import { getBrowserID } from "../services/settings";
import { useTranslation } from "../i18n";

function SelectRole({ showToast }) {
    const navigate = useNavigate();
    const t = useTranslation();
    const [isInstalled, installPrompt] = usePWAInstaller("baby-monitor-pwa");

    function showPWAInstallPrompt() {
        if (!installPrompt) {
            showToast(t("role.installUnavailable"));
            return;
        }
        installPrompt.prompt();
    }

    return (
        <div className="container-y no-select" style={{ width: "100%", height: "95vh" }}>
            <div className="container-x">
                <div style={{ margin: "0.75em" }}>
                    <div style={{ marginTop: "0.2em" }}><strong>{t("role.browserId")}</strong></div>
                    <div style={{ marginTop: "0.1em", fontFamily: "Consolas, monospace", fontSize: "smaller" }}>{getBrowserID()}</div>
                </div>
                <div className="container-x" style={{ justifyContent: "flex-end", alignItems: "center", gap: "1em", margin: "0.75em" }}>
                    <CircleQuestionMark size={38} onClick={() => navigate('/help')} className="icon"><title>{t("role.help")}</title></CircleQuestionMark>
                    {!isInstalled && <Smartphone size={36} onClick={showPWAInstallPrompt} className="icon"><title>{t("role.install")}</title></Smartphone>}
                    <Settings size={40} onClick={() => navigate('/settings')} className="icon"><title>{t("role.settings")}</title></Settings>
                </div>
            </div>

            <div className="container-y middle">
                <div className="text-title" style={{ marginBottom: "0.5em" }}>{t("role.select")}</div>

                <div className="container-y" style={{ width: "auto", gap: "3em" }}>
                    <button onClick={() => navigate('/baby-device')} className="button">
                        {t("role.babyPrefix")} <strong>{t("role.baby")}</strong> {t("role.babyDetail")}
                    </button>
                    <button onClick={() => navigate('/parent-device')} className="button">
                        {t("role.parentPrefix")} <strong>{t("role.parent")}</strong> {t("role.parentDetail")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SelectRole;
