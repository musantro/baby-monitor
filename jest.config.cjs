module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: [
    "src/domain/**/*.ts",
    "src/services/**/*.ts",
    "src/custom-hooks/useRefState.ts",
    "src/custom-hooks/useSettings.ts",
    "src/components/{NumberInput,ToggleSwitch,Settings,SettingsForm}.tsx",
  ],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
  },
};
