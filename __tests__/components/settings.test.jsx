import { fireEvent, render, screen } from "@testing-library/react";
import Settings from "../../src/components/Settings";
import { defaultSettings } from "../../src/services/settings";

beforeEach(() => localStorage.clear());

test("edits, saves and restores user settings", () => {
  const showToast = jest.fn();
  const { container } = render(<Settings showToast={showToast} />);
  const toggles = container.querySelectorAll("input[type=checkbox]");
  fireEvent.click(toggles[0].parentElement);
  fireEvent.click(screen.getByRole("button", { name: "Save Settings" }));
  expect(showToast).toHaveBeenCalledWith("Settings saved!");
  expect(JSON.parse(localStorage.getItem("baby-monitor-settings"))).toEqual({
    ...defaultSettings,
    startWithFrontCamera: false,
  });
  fireEvent.click(screen.getByRole("button", { name: "Restore Defaults" }));
  expect(showToast).toHaveBeenCalledWith("Restored default settings!");
});
