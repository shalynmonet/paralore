import * as Dialog from "@radix-ui/react-dialog";
import { IconX } from "@tabler/icons-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag className={cn("rounded-lg border border-border bg-card", className)}>
      {children}
    </Tag>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export function DisplayHeading({
  children,
  className,
  as: Tag = "h1",
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <Tag className={cn("font-pl-display font-normal tracking-tight text-foreground", className)}>
      {children}
    </Tag>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border border-border bg-transparent text-foreground hover:bg-accent",
  danger: "border border-pl-coral/50 bg-transparent text-pl-coral hover:bg-pl-coral/10",
};

export function PLButton({
  variant = "secondary",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50",
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

export function Notice({
  tone,
  children,
}: {
  tone: "info" | "success" | "error";
  children: ReactNode;
}) {
  const toneClass = {
    info: "border-border bg-accent/40 text-foreground",
    success: "border-pl-teal/40 bg-pl-teal/10 text-foreground",
    error: "border-pl-coral/50 bg-pl-coral/10 text-foreground",
  }[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-md border px-4 py-3 text-sm leading-relaxed", toneClass)}
    >
      {children}
    </div>
  );
}

export function Pill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "teal" | "amber" | "coral";
  children: ReactNode;
}) {
  const toneClass = {
    neutral: "border-border text-muted-foreground",
    teal: "border-pl-teal/50 text-pl-teal",
    amber: "border-primary/60 text-primary",
    coral: "border-pl-coral/60 text-pl-coral",
  }[tone];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", toneClass)}>
      {children}
    </span>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  onConfirm,
  pending,
  error,
  danger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  pending: boolean;
  error?: string | null;
  danger?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <Dialog.Portal>
        <Dialog.Overlay className="dark fixed inset-0 z-40 bg-background/70 backdrop-blur-[2px]" />
        <Dialog.Content className="dark pl-root fixed left-1/2 top-1/2 z-50 w-[min(92vw,34rem)] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-2xl focus:outline-none">
          <Dialog.Title className="font-pl-display text-2xl font-normal text-foreground">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </Dialog.Description>
          {children ? <div className="mt-5">{children}</div> : null}
          {error ? (
            <div className="mt-5">
              <Notice tone="error">{error}</Notice>
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Dialog.Close asChild>
              <PLButton disabled={pending}>Cancel</PLButton>
            </Dialog.Close>
            <PLButton
              variant={danger ? "danger" : "primary"}
              onClick={onConfirm}
              disabled={pending}
            >
              {pending ? "Working..." : confirmLabel}
            </PLButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Drawer({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dark fixed inset-0 z-40 bg-background/60" />
        <Dialog.Content className="dark pl-root fixed inset-y-0 right-0 z-50 flex w-[min(92vw,30rem)] flex-col overflow-y-auto border-l border-border bg-card p-6 shadow-2xl focus:outline-none">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="font-pl-display text-2xl font-normal text-foreground">
              {title}
            </Dialog.Title>
            <Dialog.Close
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              aria-label="Close"
            >
              <IconX size={18} />
            </Dialog.Close>
          </div>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export interface SeriesPoint {
  label: string;
  value: number;
  marker?: "enactment" | "baseline" | undefined;
}

export function LineChart({
  points,
  ariaLabel,
  color = "hsl(var(--pl-teal))",
}: {
  points: SeriesPoint[];
  ariaLabel: string;
  color?: string;
}) {
  const width = 640;
  const height = 230;
  const padLeft = 40;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 34;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;
  const xFor = (index: number) =>
    points.length === 1
      ? padLeft + innerWidth / 2
      : padLeft + (index / (points.length - 1)) * innerWidth;
  const yFor = (value: number) => padTop + (1 - value / 100) * innerHeight;
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${xFor(index).toFixed(1)},${yFor(point.value).toFixed(1)}`)
    .join(" ");
  const gridValues = [0, 25, 50, 75, 100];
  const labelEvery = Math.max(1, Math.ceil(points.length / 7));

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={ariaLabel}
      >
        {gridValues.map((value) => (
          <g key={value}>
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={yFor(value)}
              y2={yFor(value)}
              stroke="hsl(var(--border))"
              strokeWidth={1}
            />
            <text x={padLeft - 8} y={yFor(value) + 4} textAnchor="end" fontSize={11} fill="hsl(var(--muted-foreground))">
              {value}
            </text>
          </g>
        ))}
        {points.length > 1 ? (
          <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        ) : null}
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle
              cx={xFor(index)}
              cy={yFor(point.value)}
              r={point.marker === "enactment" ? 6 : 3.5}
              fill={point.marker === "enactment" ? "hsl(var(--pl-amber))" : color}
              stroke="hsl(var(--card))"
              strokeWidth={point.marker ? 2 : 0}
            >
              <title>{`${point.label}: ${point.value.toFixed(1)}`}</title>
            </circle>
            {index % labelEvery === 0 || index === points.length - 1 ? (
              <text x={xFor(index)} y={height - 10} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))">
                {point.label}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </figure>
  );
}

export function DeltaBar({
  label,
  delta,
  higherIsBetter,
  detail,
}: {
  label: string;
  delta: number;
  higherIsBetter: boolean;
  detail?: string;
}) {
  const magnitude = Math.min(100, Math.abs(delta) * 2.5);
  const good = higherIsBetter ? delta > 0 : delta < 0;
  const neutral = Math.abs(delta) < 0.05;
  const barColor = neutral ? "bg-muted-foreground/40" : good ? "bg-pl-teal" : "bg-pl-coral";
  const sign = delta > 0 ? "+" : delta < 0 ? "\u2212" : "";
  return (
    <div className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-x-3 gap-y-1 text-sm">
      <span className="truncate text-foreground">{label}</span>
      <div className="h-2 rounded-full bg-muted">
        <div className={cn("h-2 rounded-full", barColor)} style={{ width: `${magnitude}%` }} />
      </div>
      <span className="w-24 text-right tabular-nums text-foreground">
        {neutral ? "0.0" : `${sign}${Math.abs(delta).toFixed(1)}`} pts
      </span>
      {detail ? <span className="col-span-3 text-xs tabular-nums text-muted-foreground">{detail}</span> : null}
    </div>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
      {label}
    </div>
  );
}
