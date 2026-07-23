import { useEffect, useState } from "react";

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
        <div className="number-input">
            <button aria-disabled={number <= min} className="inc-dec-btn"
                onClick={() => changeValueBy(-1)}>‒</button>
            <input type="text" value={number} id={id} disabled readOnly />
            <button aria-disabled={number >= max} className="inc-dec-btn"
                onClick={() => changeValueBy(+1)}>+</button>
        </div >
    );
}

export default NumberInput;
