import { useEffect, useState, type CSSProperties } from "react";

interface NumberInputProps {
  value?: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  id: string;
}

function NumberInput({ value, min, max, onChange, id }: NumberInputProps) {
    const [number, setNumber] = useState(value ?? min ?? max ?? 0);

    useEffect(() => setNumber(value ?? min ?? max ?? 0), [value, min, max]);

    function changeValueBy(step = 0) {
        let newNumber = number + step;
        if (newNumber > max) newNumber = +max;
        if (newNumber < min) newNumber = +min;
        onChange(newNumber);
        setNumber(newNumber);
    }

    return (
        <div style={container}>
            <button style={{
                borderRadius: "8px 0px 0px 8px",
                background: number <= min ? "#ff5b00" : "#007bff"
            }}
                className="inc-dec-btn"
                onClick={() => changeValueBy(-1)}>‒</button>
            <input style={input} type="text" value={number} id={id} disabled readOnly />
            <button style={{
                borderRadius: "0px 8px 8px 0px",
                background: number >= max ? "#ff5b00" : "#007bff"
            }}
                className="inc-dec-btn"
                onClick={() => changeValueBy(+1)}>+</button>
        </div >
    );
}

export default NumberInput;

const container: CSSProperties = {
    display: "flex", justifyContent: "center", alignItems: "center",
    width: "auto", height: "40px",
};

const input: CSSProperties = {
    width: "2ch", height: "40px",
    margin: "0", padding: "0px 5px",
    background: "white", color: "black",
    fontSize: "24px", lineHeight: "40px",
    textAlign: "center", verticalAlign: "middle",
    border: "none",
};
