import { cn } from "@/lib/utils";

/* ----- Standardised SVG Icons (24×24, 1.5px, round caps) ----- */

const iconClass = "w-6 h-6";

export function IconConsultation({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn(iconClass, className)}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="13" x2="12" y2="13" />
    </svg>
  );
}

export function IconAssessment({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn(iconClass, className)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
      <polyline points="9 9 10 9 11 9" />
    </svg>
  );
}

export function IconHeartPulse({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn(iconClass, className)}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <polyline points="3.6 11 7 11 8.5 8.5 11.5 13.5 13 11 16 11" />
    </svg>
  );
}

export function IconTrending({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn(iconClass, className)}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

export function IconDumbbell({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn(iconClass, className)}>
      <path d="M6.5 6.5h11v11h-11z" />
      <line x1="6.5" y1="9.5" x2="17.5" y2="9.5" />
      <line x1="6.5" y1="14.5" x2="17.5" y2="14.5" />
      <rect x="2" y="8" width="4" height="8" rx="1" />
      <rect x="18" y="8" width="4" height="8" rx="1" />
    </svg>
  );
}

export function IconTarget({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn(iconClass, className)}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function IconCalendar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn(iconClass, className)}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function IconShield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={cn(iconClass, className)}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

/* ----- Standardised Icon Frame (coloured circle background behind icon) ----- */

type FrameColor = "teal" | "rose" | "charcoal" | "muted";

const frameStyles: Record<FrameColor, { bg: string; icon: string }> = {
  teal:     { bg: "bg-primary/15", icon: "text-primary" },
  rose:     { bg: "bg-accent/15",  icon: "text-accent" },
  charcoal: { bg: "bg-foreground/10", icon: "text-foreground" },
  muted:    { bg: "bg-muted",    icon: "text-muted-foreground" },
};

export function IconFrame({
  icon,
  color = "teal",
  size = "md",
}: {
  icon: React.ReactNode;
  color?: FrameColor;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "sm" ? "w-10 h-10" : size === "lg" ? "w-16 h-16" : "w-14 h-14";
  const iconSize = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  return (
    <div className={cn("rounded-full flex items-center justify-center shrink-0", frameStyles[color].bg, sizeClass)}>
      <span className={cn(frameStyles[color].icon, iconSize)}>{icon}</span>
    </div>
  );
}

/* ----- Standardised Stat Block ----- */

export function StatBlock({
  value,
  label,
  color = "teal",
}: {
  value: string;
  label: string;
  color?: FrameColor;
}) {
  const valueColor = color === "teal" ? "text-primary" : color === "rose" ? "text-accent" : "text-foreground";
  return (
    <div className="text-center">
      <p className={cn("text-4xl md:text-5xl font-bold tracking-tight", valueColor)}>{value}</p>
      <p className="text-muted-foreground text-sm mt-1 max-w-[180px] mx-auto">{label}</p>
    </div>
  );
}

/* ----- Standardised Process Flow Step ----- */

interface ProcessStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: FrameColor;
}

export function ProcessFlow({ steps }: { steps: ProcessStep[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 relative">
      {/* Connecting line (desktop) */}
      <div className="hidden lg:block absolute top-9 left-[12.5%] right-[12.5%] h-px bg-border" />

      {steps.map((step, i) => (
        <div key={i} className="flex flex-col items-center text-center relative">
          {/* Step number badge */}
          <div className="absolute -top-1 -right-1 lg:top-0 lg:right-4 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
            {i + 1}
          </div>
          <IconFrame icon={step.icon} color={step.color} />
          <h4 className="text-foreground font-semibold text-lg mt-4 mb-1.5">{step.title}</h4>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-[240px]">{step.description}</p>
        </div>
      ))}
    </div>
  );
}

/* ----- Standardised Feature Card (icon + title + desc) ----- */

export function FeatureCard({
  icon,
  title,
  description,
  color = "teal",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: FrameColor;
}) {
  return (
    <div className="bg-muted rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <IconFrame icon={icon} color={color} size="md" />
      <h4 className="text-foreground font-semibold text-lg mt-4 mb-1.5">{title}</h4>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
