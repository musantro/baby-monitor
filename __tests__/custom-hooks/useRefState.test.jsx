import { act, renderHook } from "@testing-library/react";
import useRefState from "../../src/custom-hooks/useRefState";

test("useRefState keeps a synchronous current value", () => {
  const { result } = renderHook(() => useRefState(1));
  act(() => result.current[1](2));
  expect(result.current[0]).toBe(2);
  expect(result.current[2]()).toBe(2);
  act(() => result.current[1]((value) => value + 3));
  expect(result.current[2]()).toBe(5);
});
