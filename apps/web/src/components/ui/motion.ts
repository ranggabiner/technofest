const base =
  "motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none";

export const modalExitDurationMs = 160;

export const motion = {
  base,
  button: `${base} motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[var(--shadow-elevated)] motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] disabled:motion-safe:transform-none disabled:motion-safe:shadow-none`,
  card: `${base} motion-safe:transition-shadow`,
  cardInteractive: `${base} motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[var(--shadow-elevated)] motion-safe:active:translate-y-0 motion-safe:active:scale-[0.99]`,
  fade: "motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none",
  iconButton: `${base} motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.96]`,
  input: `${base} motion-safe:focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-teal-primary)_18%,transparent)]`,
  loadingContent:
    "motion-safe:transition-opacity motion-safe:duration-150 motion-safe:ease-out motion-reduce:transition-none",
  menuPanel: `${base} motion-safe:origin-top-right motion-safe:will-change-[opacity,transform]`,
  menuTrigger: `${base} motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.96]`,
  modalOverlay: "motion-safe:will-change-[opacity] motion-reduce:transition-none",
  modalPanel: "motion-safe:will-change-[opacity,transform] motion-reduce:transition-none",
  navItem: `${base} motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98]`,
  navLink: `${base} motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98]`,
} as const;
