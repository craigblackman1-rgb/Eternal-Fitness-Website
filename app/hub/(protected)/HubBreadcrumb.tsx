"use client";

import { usePathname } from "next/navigation";
import { useCrumbName } from "./CrumbNameContext";

const crumbLabels: Record<string, string> = {
  "/hub": "Today",
  "/hub/schedule": "Schedule",
  "/hub/clients": "Clients",
  "/hub/tasks": "Tasks",
  "/hub/workouts": "Workouts",
  "/hub/programs": "Programmes",
  "/hub/programs/import": "Import a programme",
  "/hub/exercises": "Exercises",
  "/hub/document-templates": "Document templates",
  "/hub/compliance": "Compliance",
  "/hub/cashflow": "Cashflow",
  "/hub/settings": "Settings",
  "/hub/agreements": "Agreements",
  "/hub/reports/updates": "Email updates",
  "/hub/sessions/review": "Cancellation review",
  "/hub/sessions/lapse-review": "Lapse review",
  "/hub/documents": "Sent documents",
  "/hub/cashflow/invoices": "Invoices",
  "/hub/cashflow/transactions": "Transactions",
  "/hub/cashflow/forecast": "Forecast",
};

/** Section routes whose children show as Hub / Section / Page. */
const sectionRoutes: Record<string, string> = {
  "/hub/documents": "Documents",
  "/hub/document-templates": "Documents",
  "/hub/cashflow/invoices": "Finance",
  "/hub/cashflow/transactions": "Finance",
  "/hub/cashflow/forecast": "Finance",
};

function resolveCrumb(pathname: string): { section: string | null; label: string } {
  if (crumbLabels[pathname]) {
    const section = sectionRoutes[pathname] ?? null;
    return { section, label: crumbLabels[pathname] };
  }
  if (pathname.startsWith("/hub/clients/") && pathname.includes("/blocks/")) {
    if (pathname.endsWith("/review")) return { section: "Clients", label: "Program Review" };
    if (pathname.endsWith("/print")) return { section: "Clients", label: "Print programme" };
    if (pathname.includes("/sessions/")) return { section: "Clients", label: "Session" };
    return { section: "Clients", label: "Programme" };
  }
  if (pathname.startsWith("/hub/clients/") && pathname.endsWith("/updates/new")) return { section: "Clients", label: "New Update" };
  if (pathname.startsWith("/hub/clients/") && pathname.includes("/updates/") && pathname.endsWith("/edit")) return { section: "Clients", label: "Edit Update" };
  if (pathname.startsWith("/hub/clients/") && pathname.includes("/updates")) return { section: "Clients", label: "Updates" };
  if (pathname.startsWith("/hub/clients/") && pathname.endsWith("/edit")) return { section: "Clients", label: "Edit Client" };
  if (pathname.startsWith("/hub/clients/new")) return { section: null, label: "New Client" };
  if (pathname.startsWith("/hub/clients/")) return { section: "Clients", label: "Client" };
  if (pathname.startsWith("/hub/agreements/")) return { section: "Documents", label: "Agreement" };
  if (pathname.startsWith("/hub/programs/")) return { section: null, label: "Programme builder" };
  return { section: null, label: "Hub" };
}

export function HubBreadcrumb() {
  const pathname = usePathname();
  const { section, label } = resolveCrumb(pathname);
  const ctxName = useCrumbName();
  const lastLabel = ctxName ?? label;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="text-rose font-semibold">Hub</span>
      {section && (
        <>
          <span>/</span>
          <span className="text-foreground font-medium">{section}</span>
        </>
      )}
      <span>/</span>
      <span className="text-foreground font-medium">{lastLabel}</span>
    </div>
  );
}
