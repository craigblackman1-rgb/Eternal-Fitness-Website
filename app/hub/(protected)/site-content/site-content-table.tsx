"use client";

import { useMemo, useState } from "react";
import { HubTable, type HubColumn } from "@/components/hub/HubTable";
import { HubCard, HubCardHeader } from "@/components/hub";
import { StatusBadge } from "@/components/hub/StatusBadge";
import { KpiTile } from "@/components/hub/KpiTile";
import { cn } from "@/lib/utils";
import {
  IconFileText,
  IconCheckCircle,
  IconAlertTriangle,
  IconEdit3,
} from "@/components/icons";

interface PageKeyword {
  id: string;
  page_slug: string;
  page_title: string;
  url_path: string;
  page_type: "static" | "condition" | "legal" | "blog";
  primary_keyword: string | null;
  keyword_cluster: string[] | null;
  status: string;
  notes: string | null;
  updated_at: string;
}

// Only these static pages are wired to the page_content_blocks editor —
// everything else (blog posts, condition pages, legal pages) is
// inventory-only for now, no per-page editor built yet.
const EDITABLE_SLUGS = new Set([
  "about", "cancer-rehabilitation", "contact", "exercise-for-health",
  "faqs", "home", "personal-training", "pricing",
]);

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "published", label: "Published" },
  { value: "needs_writing", label: "Needs Writing" },
  { value: "needs_updating", label: "Needs Updating" },
];

const TYPE_FILTERS = [
  { value: "all", label: "All pages" },
  { value: "static", label: "Static" },
  { value: "condition", label: "Condition" },
  { value: "blog", label: "Blog" },
  { value: "legal", label: "Legal" },
];

const columns: HubColumn<PageKeyword>[] = [
  {
    key: "page",
    header: "Page",
    render: (row) => (
      <div>
        <p className="font-medium">{row.page_title}</p>
        <p className="text-xs text-muted-foreground">{row.url_path}</p>
      </div>
    ),
    sortable: true,
    sortValue: (row) => row.page_title,
  },
  {
    key: "type",
    header: "Type",
    render: (row) => (
      <span className="inline-flex items-center rounded-full border border-[var(--hub-border)] bg-[var(--hub-hover)] px-2 py-0.5 text-xs capitalize text-muted-foreground">
        {row.page_type}
      </span>
    ),
    sortable: true,
    sortValue: (row) => row.page_type,
  },
  {
    key: "keyword",
    header: "Target Keyword",
    render: (row) =>
      row.primary_keyword || <span className="text-muted-foreground">Not set</span>,
    sortable: true,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => <StatusBadge status={row.status} />,
    sortable: true,
  },
  {
    key: "action",
    header: "",
    render: (row) =>
      EDITABLE_SLUGS.has(row.page_slug) ? (
        <span className="text-rose text-sm font-medium">Edit copy →</span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
    className: "text-right",
  },
];

export function SiteContentTable({ keywords }: { keywords: PageKeyword[] }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const counts = useMemo(() => {
    return {
      total: keywords.length,
      published: keywords.filter((k) => k.status === "published" || k.status === "reviewed").length,
      needsWriting: keywords.filter((k) => k.status === "needs_writing").length,
      needsUpdating: keywords.filter((k) => k.status === "needs_updating" || k.status === "needs_rewrite" || k.status === "pending").length,
    };
  }, [keywords]);

  const filtered = useMemo(() => {
    return keywords.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (typeFilter !== "all" && row.page_type !== typeFilter) return false;
      return true;
    });
  }, [keywords, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile icon={<IconFileText className="w-5 h-5" />} label="Total Pages" value={counts.total} statusToken="neutral" />
        <KpiTile icon={<IconCheckCircle className="w-5 h-5" />} label="Published" value={counts.published} statusToken="success" />
        <KpiTile icon={<IconAlertTriangle className="w-5 h-5" />} label="Needs Writing" value={counts.needsWriting} statusToken="danger" />
        <KpiTile icon={<IconEdit3 className="w-5 h-5" />} label="Needs Updating" value={counts.needsUpdating} statusToken="warning" />
      </div>

      <HubCard padded={false}>
        <HubCardHeader title="Pages" />
        <div className="px-5 pb-4 flex flex-wrap gap-4">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  statusFilter === f.value
                    ? "bg-rose text-white border-rose"
                    : "bg-[var(--hub-card)] text-muted-foreground border-[var(--hub-border)] hover:bg-[var(--hub-hover)]",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  typeFilter === f.value
                    ? "bg-teal text-white border-teal"
                    : "bg-[var(--hub-card)] text-muted-foreground border-[var(--hub-border)] hover:bg-[var(--hub-hover)]",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <HubTable
          data={filtered}
          columns={columns}
          getRowHref={(row) => (EDITABLE_SLUGS.has(row.page_slug) ? `/hub/site-content/${row.page_slug}` : "#")}
          searchPlaceholder="Search pages..."
          searchKeys={["page_title", "page_slug", "primary_keyword"]}
          pageSize={20}
        />
      </HubCard>
    </div>
  );
}
