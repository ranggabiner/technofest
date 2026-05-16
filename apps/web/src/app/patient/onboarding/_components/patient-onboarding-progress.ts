export type PatientOnboardingProgressStatus = "complete" | "active" | "upcoming";

export type PatientOnboardingProgressItem = {
  number: number;
  label: string;
  status: PatientOnboardingProgressStatus;
};

export function getPatientOnboardingProgressItems(
  steps: readonly string[],
  activeStep: number,
): PatientOnboardingProgressItem[] {
  return steps.map((label, index) => {
    const number = index + 1;

    return {
      number,
      label,
      status: number < activeStep ? "complete" : number === activeStep ? "active" : "upcoming",
    };
  });
}
