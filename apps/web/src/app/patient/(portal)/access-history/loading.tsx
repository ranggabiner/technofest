import { LoadingCard } from "@/components/loading-skeletons";

export default function Loading() {
  return (
    <div className="grid gap-5" data-loading-pattern="patient-access-history">
      <LoadingCard lines={4} />
      <LoadingCard lines={5} />
    </div>
  );
}
