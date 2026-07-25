import { useEffect, useState } from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
}

function ToggleSwitch({ checked, onChange, id }: ToggleSwitchProps) {
    const [isChecked, setIsChecked] = useState(checked);

    useEffect(() => setIsChecked(checked), [checked]);

    return (
        <div className={`toggle-switch ${isChecked ? "is-checked" : ""}`}
            role="switch"
            aria-checked={isChecked}
            onClick={() => {
                const newChecked = !isChecked;
                onChange(newChecked);
                setIsChecked(newChecked);
            }}>
            <div className="toggle-knob"></div>
            <input type="checkbox" id={id} className="visually-hidden" checked={isChecked} readOnly />
        </div>
    );
}

export default ToggleSwitch;
