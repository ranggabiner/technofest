export type OnboardingProgressStatus = "complete" | "active" | "upcoming";

export type OnboardingProgressItem = {
  number: number;
  label: string;
  status: OnboardingProgressStatus;
};

export function getOnboardingProgressItems(
  steps: readonly string[],
  activeStep: number,
): OnboardingProgressItem[] {
  return steps.map((label, index) => {
    const number = index + 1;

    return {
      number,
      label,
      status: number < activeStep ? "complete" : number === activeStep ? "active" : "upcoming",
    };
  });
}
