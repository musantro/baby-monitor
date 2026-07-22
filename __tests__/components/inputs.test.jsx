import { fireEvent, render, screen } from "@testing-library/react";
import NumberInput from "../../src/components/NumberInput";
import ToggleSwitch from "../../src/components/ToggleSwitch";

describe("form input components", () => {
  test("NumberInput clamps values at both boundaries", () => {
    const onChange = jest.fn();
    render(<NumberInput id="connections" min={1} max={2} value={1} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "‒" }));
    fireEvent.click(screen.getByRole("button", { name: "+" }));
    fireEvent.click(screen.getByRole("button", { name: "+" }));
    expect(onChange.mock.calls.map(([value]) => value)).toEqual([1, 2, 2]);
    expect(screen.getByDisplayValue("2")).toBeInTheDocument();
  });

  test("ToggleSwitch reports its next checked state", () => {
    const onChange = jest.fn();
    const { container } = render(
      <ToggleSwitch id="front-camera" checked={false} onChange={onChange} />,
    );
    fireEvent.click(container.firstChild);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test("NumberInput uses its minimum value when no value is supplied", () => {
    render(<NumberInput id="fallback" min={3} max={5} onChange={jest.fn()} />);
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
  });
});
