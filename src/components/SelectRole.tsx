import { Baby, ChevronRight, Eye, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePWAInstaller } from "../custom-hooks/usePWAInstaller";
import { getBrowserID } from "../services/settings";
import { useTranslation } from "../i18n";
import AppHeader from "./AppHeader";

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
        <div className="app-page no-select">
            <AppHeader showInstall={!isInstalled} install={showPWAInstallPrompt} />
            <main className="role-layout">
                <section className="hero-copy">
                    <div className="eyebrow"><ShieldCheck size={15} /> {t("role.privateNetwork")}</div>
                    <h1>{t("role.select")}</h1>
                    <p>{t("role.subtitle")}</p>
                </section>
                <section className="role-grid">
                    <button onClick={() => navigate('/baby-device')} className="role-card">
                        <span className="role-icon"><Baby size={28} /></span>
                        <span className="role-content">
                            <strong>{t("role.baby")}</strong>
                            <small>{t("role.babyDescription")}</small>
                        </span>
                        <ChevronRight className="role-arrow" size={22} />
                    </button>
                    <button onClick={() => navigate('/parent-device')} className="role-card">
                        <span className="role-icon role-icon-secondary"><Eye size={28} /></span>
                        <span className="role-content">
                            <strong>{t("role.parent")}</strong>
                            <small>{t("role.parentDescription")}</small>
                        </span>
                        <ChevronRight className="role-arrow" size={22} />
                    </button>
                </section>
                <div className="device-id">
                    <span>{t("role.browserId")}</span>
                    <code>{getBrowserID()}</code>
                </div>
            </main>
        </div>
    );
}

export default SelectRole;
