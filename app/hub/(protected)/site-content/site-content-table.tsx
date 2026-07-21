"use client";

import { HubTable, type HubColumn } from "@/components/hub/HubTable";
import { HubCard, HubCardHeader } from "@/components/hub";
import { StatusBadge } from "@/components/hub/StatusBadge";

interface PageKeyword {
  id: string;
  page_slug: string;
  page_title: string;
  url_path: string;
  primary_keyword: string | null;
  keyword_cluster: string[] | null;
  status: string;
  notes: string | null;
  updated_at: string;
}

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
    key: "keyword",
    header: "Target Keyword",
    render: (row) =>
      row.primary_keyword || <span className="text-muted-foreground">Not set</span>,
    sortable: true,
  },
  {
    key: "cluster",
    header: "Cluster",
    render: (row) => (
      <div className="flex flex-wrap gap-1">
        {row.keyword_cluster?.length
          ? row.keyword_cluster.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs bg-[var(--hub-hover)] text-muted-foreground"
              >
                {kw}
              </span>
            ))
          : <span className="text-muted-foreground">—</span>}
      </div>
    ),
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
    render: (row) => (
      <span className="text-rose text-sm font-medium">
        Edit copy →
      </span>
    ),
    className: "text-right",
  },
];

export function SiteContentTable({ keywords }: { keywords: PageKeyword[] }) {
  return (
    <HubCard padded={false}>
      <HubCardHeader title="Pages" />
      <HubTable
        data={keywords}
        columns={columns}
        getRowHref={(row) => `/hub/site-content/${row.page_slug}`}
        searchPlaceholder="Search pages..."
        searchKeys={["page_title", "page_slug", "primary_keyword"]}
      />
    </HubCard>
  );
}
