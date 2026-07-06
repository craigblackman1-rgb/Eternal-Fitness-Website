"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/hub/EmptyState";
import { StatusBadge } from "@/components/hub/StatusBadge";
import { IconSave, IconPlus, IconArrowLeft } from "@/components/icons";
import { useRouter } from "next/navigation";

interface KeywordData {
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

interface BlockData {
  id: string;
  page_slug: string;
  block_key: string;
  label: string;
  content: string;
  version: number;
  updated_by: string | null;
  updated_at: string;
}

export function SiteContentEditor({
  keyword: initialKeyword,
  blocks: initialBlocks,
}: {
  keyword: KeywordData;
  blocks: BlockData[];
}) {
  const router = useRouter();

  // Keyword form state
  const [keyword, setKeyword] = useState<KeywordData>(initialKeyword);
  const [keywordSaving, setKeywordSaving] = useState(false);
  const [keywordDirty, setKeywordDirty] = useState(false);

  // Blocks state
  const [blocks, setBlocks] = useState<BlockData[]>(initialBlocks);
  const [savingBlock, setSavingBlock] = useState<string | null>(null);

  // Add-block form state
  const [showAdd, setShowAdd] = useState(false);
  const [newBlockKey, setNewBlockKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newContent, setNewContent] = useState("");
  const [adding, setAdding] = useState(false);

  // Editable content per block
  const [contentEdits, setContentEdits] = useState<Record<string, string>>({});

  const handleKeywordChange = useCallback(
    (field: string, value: string | string[] | null) => {
      setKeyword((prev) => ({ ...prev, [field]: value }));
      setKeywordDirty(true);
    },
    [],
  );

  const saveKeyword = async () => {
    setKeywordSaving(true);
    try {
      const res = await fetch("/api/page-keywords", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_slug: keyword.page_slug,
          primary_keyword: keyword.primary_keyword,
          keyword_cluster: keyword.keyword_cluster,
          status: keyword.status,
          notes: keyword.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to save keyword");
      setKeywordDirty(false);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setKeywordSaving(false);
    }
  };

  const saveBlock = async (block: BlockData) => {
    setSavingBlock(block.id);
    try {
      const updatedContent =
        contentEdits[block.id] !== undefined
          ? contentEdits[block.id]
          : block.content;
      const res = await fetch(`/api/page-content/${keyword.page_slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          block_key: block.block_key,
          label: block.label,
          content: updatedContent,
        }),
      });
      if (!res.ok) throw new Error("Failed to save block");
      const saved = await res.json();
      setBlocks((prev) =>
        prev.map((b) => (b.id === block.id ? saved : b)),
      );
      setContentEdits((prev) => {
        const next = { ...prev };
        delete next[block.id];
        return next;
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingBlock(null);
    }
  };

  const addBlock = async () => {
    if (!newBlockKey.trim() || !newLabel.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/page-content/${keyword.page_slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          block_key: newBlockKey.trim(),
          label: newLabel.trim(),
          content: newContent,
        }),
      });
      if (!res.ok) throw new Error("Failed to create block");
      const created = await res.json();
      setBlocks((prev) => [...prev, created]);
      setNewBlockKey("");
      setNewLabel("");
      setNewContent("");
      setShowAdd(false);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const clusterString = (keyword.keyword_cluster ?? []).join(", ");
  const setClusterFromString = (val: string) => {
    const parts = val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    handleKeywordChange("keyword_cluster", parts);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/hub/site-content"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to Site Content
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {keyword.page_title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {keyword.url_path}
            </p>
          </div>
          <StatusBadge status={keyword.status} />
        </div>
      </div>

      {/* Keyword / SEO card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SEO &amp; Keywords</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="primary_keyword">Primary Keyword</Label>
              <Input
                id="primary_keyword"
                value={keyword.primary_keyword ?? ""}
                onChange={(e) =>
                  handleKeywordChange("primary_keyword", e.target.value || null)
                }
                placeholder="e.g. personal training Worthing"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="keyword_cluster">Keyword Cluster</Label>
              <Input
                id="keyword_cluster"
                value={clusterString}
                onChange={(e) => setClusterFromString(e.target.value)}
                placeholder="Comma-separated keywords"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                value={keyword.status}
                onValueChange={(val) => handleKeywordChange("status", val)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="needs_rewrite">Needs Rewrite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={keyword.notes ?? ""}
              onChange={(e) =>
                handleKeywordChange("notes", e.target.value || null)
              }
              placeholder="Internal notes about this page's SEO strategy..."
              rows={3}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={saveKeyword}
              disabled={!keywordDirty || keywordSaving}
              className="gap-1.5"
            >
              <IconSave className="h-4 w-4" />
              {keywordSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Editable content blocks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Content Blocks</h2>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowAdd((s) => !s)}
          >
            <IconPlus className="h-4 w-4" />
            Add Block
          </Button>
        </div>

        {showAdd && (
          <Card className="mb-4 border-dashed border-rose/30">
            <CardHeader>
              <CardTitle className="text-sm">New Content Block</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new_block_key">Block Key</Label>
                  <Input
                    id="new_block_key"
                    value={newBlockKey}
                    onChange={(e) => setNewBlockKey(e.target.value)}
                    placeholder="e.g. hero_heading"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new_label">Label</Label>
                  <Input
                    id="new_label"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Hero Heading"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new_content">Initial Content</Label>
                <Textarea
                  id="new_content"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={3}
                  placeholder="Content..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAdd(false);
                    setNewBlockKey("");
                    setNewLabel("");
                    setNewContent("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  disabled={!newBlockKey.trim() || !newLabel.trim() || adding}
                  onClick={addBlock}
                >
                  {adding ? "Creating..." : "Create"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {blocks.length === 0 && !showAdd ? (
          <EmptyState
            icon={<IconSave className="h-6 w-6" />}
            title="No editable content blocks yet for this page"
            description="Add a block to start editing content that can be displayed on the live page."
            cta={{ label: "Add Block", onClick: () => setShowAdd(true) }}
          />
        ) : (
          <div className="space-y-3">
            {blocks.map((block) => {
              const editContent =
                contentEdits[block.id] !== undefined
                  ? contentEdits[block.id]
                  : block.content;
              const isSaving = savingBlock === block.id;
              const isDirty =
                (contentEdits[block.id] !== undefined &&
                  contentEdits[block.id] !== block.content) ||
                false;

              return (
                <Card key={block.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{block.label}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {block.block_key} &middot; v{block.version}
                        {block.updated_by && (
                          <> &middot; by {block.updated_by}</>
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      disabled={!isDirty || isSaving}
                      onClick={() => saveBlock(block)}
                    >
                      <IconSave className="h-4 w-4" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={editContent}
                      onChange={(e) =>
                        setContentEdits((prev) => ({
                          ...prev,
                          [block.id]: e.target.value,
                        }))
                      }
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
