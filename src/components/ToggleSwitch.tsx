import { useEffect, useState, type CSSProperties } from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id: string;
}

function ToggleSwitch({ checked, onChange, id }: ToggleSwitchProps) {
    const [isChecked, setIsChecked] = useState(checked);

    useEffect(() => setIsChecked(checked), [checked]);

    return (
        <div style={{
            ...outerDiv,
            border: "2px solid " + (isChecked ? "#007bff" : "#ff5b00")
        }}
            onClick={() => {
                const newChecked = !isChecked;
                onChange(newChecked);
                setIsChecked(newChecked);
            }}>
            <div style={{
                ...innerDiv,
                transform: `translateX(${isChecked ? 30 : 0}px)`,
                background: isChecked ? "#007bff" : "#ff5b00"
            }}></div>
            <input type="checkbox" id={id} style={fakeInputStyle} />
        </div>
    );
}

export default ToggleSwitch;

const outerDiv: CSSProperties = {
    width: "60px", height: "30px",
    margin: "0", padding: "0",
    background: "white",
    cursor: "pointer",
    borderRadius: "16px",
    transition: "border 150ms ease-in-out"
};

const innerDiv: CSSProperties = {
    position: "relative",
    width: "26px", height: "26px",
    margin: "0", padding: "0",
    border: "2px solid white", borderRadius: "16px",
    transition: "transform 150ms ease-in-out"
};

const fakeInputStyle: CSSProperties = {
    display: "none",
    width: "0", height: "0",
    margin: "0", padding: "0"
};
