import { useCallback, useEffect, useRef, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import BabyDevice from "./components/BabyDevice";
import ParentDevice from "./components/ParentDevice";
import SelectRole from "./components/SelectRole";
import Settings from "./components/Settings";

function App() {
  const timeoutRef = useRef(null);
  const [toast, setToast] = useState({ text: "Toast Message!", visible: false });

  useEffect(() => { takeWakeLock(); });

  async function takeWakeLock() {
    try { await navigator?.wakeLock?.request("screen"); }
    catch { console.warn("Screen Wake-Lock Failed!"); }
  }

  const showToast = useCallback((text) => {
    if (timeoutRef.current) {
      setToast(prev => ({ ...prev, visible: false }));
      clearTimeout(timeoutRef.current);
    }
    setToast({ visible: true, text });
    timeoutRef.current = setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  }, []);

  return (<>
    <HashRouter>
      <Routes>
        <Route path="/" element={<SelectRole showToast={showToast} />} />
        <Route path="/settings" element={<Settings showToast={showToast} />} />
        <Route path="/baby-device" element={<BabyDevice showToast={showToast} />} />
        <Route path="/parent-device" element={<ParentDevice showToast={showToast} />} />
      </Routes>
    </HashRouter>
    {toast.visible && <div className="toast no-select">{toast.text}</div>}
  </>);
}

export default App;
