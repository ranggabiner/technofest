export const themes = ["light", "dark"] as const;

export type AppTheme = (typeof themes)[number];

export const themeStorageKey = "medproof_theme";

export const themeToggleTargets: Record<AppTheme, AppTheme> = {
  light: "dark",
  dark: "light",
};

export function isAppTheme(value: unknown): value is AppTheme {
  return themes.includes(value as AppTheme);
}

export function getNextTheme(currentTheme: unknown): AppTheme {
  return isAppTheme(currentTheme) ? themeToggleTargets[currentTheme] : "light";
}
