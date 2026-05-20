import Link from "next/link";
import { AlertTriangle, Ban, FileSearch, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { roleEntryPath, type ResolvedRole } from "@/lib/auth/roles";
import { getDictionary } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export { EmptyState, InlineStatusMessage } from "@/components/state-messages";

type StateTone = "neutral" | "warning" | "danger";

const toneClasses: Record<StateTone, string> = {
  neutral: "bg-[var(--color-stone-surface)] text-[var(--color-ash)]",
  warning: "bg-[var(--color-warning-surface)] text-[var(--color-warning-text)]",
  danger: "bg-[var(--color-error-surface)] text-[var(--color-error-red)]",
};

export function StatePanel({
  title,
  description,
  tone = "neutral",
  action,
}: {
  title: string;
  description: string;
  tone?: StateTone;
  action?: React.ReactNode;
}) {
  const Icon = tone === "danger" ? AlertTriangle : tone === "warning" ? ShieldAlert : FileSearch;

  return (
    <Card>
      <CardHeader>
        <div className={cn("mb-3 flex size-10 items-center justify-center rounded-full", toneClasses[tone])}>
          <Icon size={18} />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {action ? <div>{action}</div> : null}
    </Card>
  );
}

export async function ForbiddenState({ role }: { role: ResolvedRole }) {
  const copy = await getDictionary();

  return (
    <StatePanel
      title={copy.state.forbiddenTitle}
      description={copy.state.forbiddenDescription}
      tone="danger"
      action={
        <Button asChild variant="secondary">
          <Link href={roleEntryPath(role)}>
            <Ban size={16} />
            {copy.state.backToDashboard}
          </Link>
        </Button>
      }
    />
  );
}
