import en from "../src/locales/en-EN.json";
import es from "../src/locales/es-ES.json";
import i18n, { translate } from "../src/i18n";

const leafKeys = (value: object, prefix = ""): string[] => Object.entries(value).flatMap(([key, child]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  return typeof child === "object" ? leafKeys(child, path) : path;
});

afterEach(async () => i18n.changeLanguage("en-EN"));

test("both locales expose the same translation keys", () => {
  expect(leafKeys(es).sort()).toEqual(leafKeys(en).sort());
});

test("translates and interpolates variables through i18next", async () => {
  await i18n.changeLanguage("es-ES");
  expect(translate("baby.unknownParent", { parentId: "abc-123" })).toContain("abc-123");
  expect(translate("baby.start")).toBe("Iniciar cámara");
});
