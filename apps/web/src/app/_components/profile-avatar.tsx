"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export function ProfileAvatar({
  className,
  fallback = "M",
  name,
  src,
}: {
  className?: string;
  fallback?: string;
  name: string;
  src: string | null;
}) {
  const initials = getInitials(name, fallback);

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--color-stone-surface)] bg-[var(--color-stone-surface)] font-semibold text-[var(--color-midnight)]",
        className,
      )}
    >
      <span>{initials}</span>
      {src ? <ProfileAvatarImage key={src} src={src} /> : null}
    </span>
  );
}

function ProfileAvatarImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    // Direct image loading keeps Supabase public/signed URLs observable and lets failures fall back to initials.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="absolute inset-0 size-full object-cover"
      decoding="async"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

export function getInitials(name: string, fallback = "M") {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || fallback
  );
}
