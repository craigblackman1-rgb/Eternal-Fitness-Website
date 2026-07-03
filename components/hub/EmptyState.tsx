import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  cta?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon, title, description, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      {icon && (
        <div className="w-16 h-16 rounded-full bg-rose/10 flex items-center justify-center">
          <div className="text-rose/50">{icon}</div>
        </div>
      )}
      <div className="text-center">
        <p className="font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {cta && (
        cta.href ? (
          <Link href={cta.href}>
            <Button className="rounded-full gap-1.5 bg-rose hover:bg-rose/90 text-white">
              {cta.label}
            </Button>
          </Link>
        ) : (
          <Button onClick={cta.onClick} className="rounded-full gap-1.5 bg-rose hover:bg-rose/90 text-white">
            {cta.label}
          </Button>
        )
      )}
    </div>
  );
}
