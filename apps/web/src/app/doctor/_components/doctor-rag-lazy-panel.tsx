"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

type DoctorRagCopy = {
  questionRequired: string;
  answerFailed: string;
  questionLabel: string;
  placeholder: string;
  processing: string;
  ask: string;
};

const DoctorRagClient = dynamic(
  () => import("./doctor-rag-client").then((module) => module.DoctorRagClient),
  {
    ssr: false,
    loading: () => <DoctorRagPanelSkeleton />,
  },
);

export function DoctorRagLazyPanel({
  grantId,
  copy,
}: {
  grantId: string;
  copy: DoctorRagCopy;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) return;

    const node = panelRef.current;
    if (!node || !("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px", threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <div ref={panelRef} data-doctor-rag-lazy-panel>
      {shouldLoad ? <DoctorRagClient grantId={grantId} copy={copy} /> : <DoctorRagPanelSkeleton />}
    </div>
  );
}

function DoctorRagPanelSkeleton() {
  return (
    <div className="grid min-h-[280px] animate-pulse gap-4 rounded-[10px] border border-[var(--color-fog)] bg-[var(--color-card)] p-4">
      <div className="h-24 rounded-[10px] bg-[var(--color-stone-surface)]" />
      <div className="h-28 rounded-[10px] bg-[var(--color-stone-surface)]" />
      <div className="h-11 w-36 rounded-[10px] bg-[var(--color-stone-surface)]" />
    </div>
  );
}
