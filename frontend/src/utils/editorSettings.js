export const THEME_OPTIONS = [
  { value: "auto", label: "Match app theme" },
  { value: "vs-dark", label: "VS Dark" },
  { value: "light", label: "Light" },
  { value: "hc-black", label: "High Contrast" },
];

export const FONT_SIZES = [12, 13, 14, 16, 18, 20];

const KEY = "codesync-editor-settings";
const DEFAULTS = { theme: "auto", fontSize: 14 };

export function loadEditorSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return DEFAULTS;
  }
}

export function saveEditorSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // storage blocked: settings last until refresh
  }
}