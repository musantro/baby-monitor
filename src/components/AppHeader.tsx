import { ArrowLeft, Baby, CircleHelp, Settings, Smartphone } from "lucide-react";
import { useTranslation } from "../i18n";

interface AppHeaderProps {
  back?: boolean;
  install?: () => void;
  showInstall?: boolean;
}

export default function AppHeader({ back = false, install, showInstall = false }: AppHeaderProps) {
  const t = useTranslation();
  const navigate = (path: string) => {
    window.location.hash = `#${path}`;
  };

  return (
    <header className="app-header">
      <div className="brand">
        {back ? (
          <button className="icon-button" onClick={() => navigate("/")} aria-label={t("help.back")}>
            <ArrowLeft size={20} />
          </button>
        ) : (
          <span className="brand-mark"><Baby size={22} /></span>
        )}
        <span>{t("app.title")}</span>
      </div>
      {!back && (
        <nav className="header-actions" aria-label="App actions">
          <button className="icon-button" onClick={() => navigate("/help")} aria-label={t("role.help")}>
            <CircleHelp size={20} />
          </button>
          {showInstall && (
            <button className="icon-button" onClick={install} aria-label={t("role.install")}>
              <Smartphone size={20} />
            </button>
          )}
          <button className="icon-button" onClick={() => navigate("/settings")} aria-label={t("role.settings")}>
            <Settings size={20} />
          </button>
        </nav>
      )}
    </header>
  );
}
