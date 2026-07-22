import { useState, useRef, useCallback } from "react";

function useRefState<T>(defaultValue: T): [T, (valueOrUpdater: T | ((previous: T) => T)) => void, () => T] {
  const [state, setState] = useState(defaultValue);
  const ref = useRef(defaultValue);

  const setValue = useCallback((valueOrUpdater: T | ((previous: T) => T)) => {
    if (typeof valueOrUpdater === "function") {
      const updater = valueOrUpdater as (previous: T) => T;
      setState((prev) => {
        const newValue = updater(prev);
        ref.current = newValue;
        return newValue;
      });
    } else {
      ref.current = valueOrUpdater;
      setState(valueOrUpdater);
    }
  }, []);

  const getValue = useCallback(() => ref.current, []);

  return [state, setValue, getValue];
}

export default useRefState;
