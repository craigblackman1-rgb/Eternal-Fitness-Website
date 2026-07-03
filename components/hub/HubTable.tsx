"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { IconSearch } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface HubColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | null;
  className?: string;
  headerClassName?: string;
}

interface HubTableProps<T> {
  data: T[];
  columns: HubColumn<T>[];
  getRowHref: (row: T) => string;
  searchPlaceholder?: string;
  searchKeys?: (keyof T | ((row: T) => string))[];
  emptyState?: React.ReactNode;
}

export function HubTable<T>({
  data,
  columns,
  getRowHref,
  searchPlaceholder = "Search...",
  searchKeys = ["name" as keyof T],
  emptyState,
}: HubTableProps<T>) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const lower = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) => {
        if (typeof key === "function") {
          return String(key(row)).toLowerCase().includes(lower);
        }
        const val = row[key as keyof T];
        return val != null && String(val).toLowerCase().includes(lower);
      }),
    );
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;
      if (col.sortValue) {
        aVal = col.sortValue(a);
        bVal = col.sortValue(b);
      } else {
        aVal = (a as any)[sortKey] ?? null;
        bVal = (b as any)[sortKey] ?? null;
      }
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === "string" && typeof bVal === "string"
        ? aVal.localeCompare(bVal)
        : aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, columns]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl border-border/60"
        />
      </div>

      {sorted.length === 0 ? (
        emptyState || (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No results found.
          </p>
        )
      ) : (
        <div className="rounded-2xl border border-border/60 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "text-xs uppercase tracking-wide text-muted-foreground font-medium sticky top-0 bg-white z-10",
                      col.sortable && "cursor-pointer select-none hover:text-foreground",
                      col.headerClassName,
                    )}
                    onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortable && sortKey === col.key && (
                        <span className="text-[10px] leading-none">
                          {sortDir === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row, i) => {
                const rowId = (row as any).id ?? i;
                const href = getRowHref(row);
                return (
                  <TableRow
                    key={rowId}
                    className="border-border/60 hover:bg-off-white transition-colors cursor-pointer"
                    onClick={() => router.push(href)}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.key} className={cn("text-sm", col.className)}>
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
