"use client";

import { useState } from "react";
import { Video, Image, ExternalLink } from "lucide-react";

function getYoutubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return null;
}

export function ExerciseMediaDisplay({
  media,
  exerciseName,
  onEdit,
}: {
  media?: { image_url?: string; video_url?: string };
  exerciseName: string;
  onEdit?: (media: { image_url?: string; video_url?: string }) => void;
}) {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const videoEmbed = media?.video_url ? getYoutubeEmbedUrl(media.video_url) : null;

  const handleAddMedia = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    const embed = getYoutubeEmbedUrl(trimmed);
    if (embed) {
      onEdit?.({ video_url: trimmed });
    } else {
      onEdit?.({ image_url: trimmed });
    }
    setUrlInput("");
    setShowUrlInput(false);
  };

  if (!media?.video_url && !media?.image_url && !onEdit) return null;

  return (
    <div className="space-y-2">
      {videoEmbed && (
        <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
          <iframe
            src={videoEmbed}
            title={exerciseName}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      )}

      {media?.image_url && !videoEmbed && (
        <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
          <img
            src={media.image_url}
            alt={exerciseName}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {!media?.video_url && !media?.image_url && (
        <div className="flex items-center gap-2 rounded-md border border-dashed p-2 text-xs text-muted-foreground">
          <Video className="h-3 w-3" />
          <span>No video available</span>
          {onEdit && (
            <span
              className="ml-auto cursor-pointer text-accent hover:underline"
              onClick={() => setShowUrlInput(!showUrlInput)}
            >
              + Add video
            </span>
          )}
        </div>
      )}

      {media?.video_url && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ExternalLink className="h-3 w-3" />
          <a
            href={media.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate hover:underline"
          >
            {media.video_url}
          </a>
          {onEdit && (
            <button
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="ml-auto text-accent hover:underline"
            >
              Change
            </button>
          )}
        </div>
      )}

      {showUrlInput && onEdit && (
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="YouTube URL or image URL..."
            className="min-w-0 flex-1 rounded-md border px-2 py-1 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleAddMedia()}
          />
          <button
            onClick={handleAddMedia}
            className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

export function ExerciseMediaPlaceholder({
  exerciseName,
}: {
  exerciseName: string;
}) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + " exercise demonstration")}`;
  return (
    <a
      href={searchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
    >
      <Video className="h-3 w-3" />
      Search YouTube for &quot;{exerciseName}&quot;
    </a>
  );
}
