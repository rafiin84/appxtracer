import {
  CheckCircle,
  Warning,
  WarningOctagon,
  XCircle,
  Question,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { Criticality, HealthState, Severity } from "@/types";
import { HEALTH_LABEL, SEVERITY_DESCRIPTION, SEVERITY_LABEL } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

/**
 * Status never relies on colour alone: every badge pairs a hue with an icon and
 * a written label, which is also what keeps the light-mode warning and serious
 * steps legible below 3:1 contrast.
 */
const HEALTH_STYLE: Record<
  HealthState,
  { tone: "good" | "warning" | "serious" | "critical" | "neutral"; icon: Icon }
> = {
  healthy: { tone: "good", icon: CheckCircle },
  degraded: { tone: "warning", icon: Warning },
  impaired: { tone: "serious", icon: WarningOctagon },
  critical: { tone: "critical", icon: XCircle },
  unknown: { tone: "neutral", icon: Question },
};

export function HealthBadge({
  health,
  size = "sm",
  label,
  className,
}: {
  health: HealthState;
  size?: "sm" | "md";
  label?: string;
  className?: string;
}) {
  const style = HEALTH_STYLE[health];
  const Icon = style.icon;
  return (
    <Badge tone={style.tone} size={size} className={className}>
      <Icon weight="fill" aria-hidden />
      {label ?? HEALTH_LABEL[health]}
    </Badge>
  );
}

/** A bare status dot for dense rows, always accompanied by adjacent text. */
export function HealthDot({ health, className }: { health: HealthState; className?: string }) {
  const colour = {
    healthy: "bg-good",
    degraded: "bg-warning",
    impaired: "bg-serious",
    critical: "bg-critical",
    unknown: "bg-ink-muted",
  }[health];
  return (
    <span className={cn("inline-grid size-2 shrink-0 place-items-center", className)} aria-hidden>
      <span className={cn("size-2 rounded-full", colour)} />
    </span>
  );
}

const SEVERITY_TONE: Record<Severity, "critical" | "serious" | "warning" | "neutral"> = {
  sev1: "critical",
  sev2: "serious",
  sev3: "warning",
  sev4: "neutral",
};

export function SeverityBadge({ severity, size = "sm" }: { severity: Severity; size?: "sm" | "md" }) {
  return (
    <Badge tone={SEVERITY_TONE[severity]} size={size} title={SEVERITY_DESCRIPTION[severity]}>
      {severity === "sev1" ? <XCircle weight="fill" aria-hidden /> : <Warning weight="fill" aria-hidden />}
      {SEVERITY_LABEL[severity]}
    </Badge>
  );
}

const CRITICALITY_LABEL: Record<Criticality, string> = {
  "mission-critical": "Mission critical",
  "business-critical": "Business critical",
  important: "Important",
  standard: "Standard",
};

export function CriticalityBadge({ criticality }: { criticality: Criticality }) {
  return (
    <Badge tone="outline" size="sm">
      {CRITICALITY_LABEL[criticality]}
    </Badge>
  );
}
