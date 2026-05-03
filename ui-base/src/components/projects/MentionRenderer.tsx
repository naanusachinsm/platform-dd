import { useMemo } from "react";
import { parseMentions } from "@/utils/mentionUtils";
import type { ProjectAsset } from "@/api/projectTypes";

interface MentionRendererProps {
  content: string;
  assets: ProjectAsset[];
  className?: string;
}

export default function MentionRenderer({ content, assets, className }: MentionRendererProps) {
  const assetMap = useMemo(
    () => new Map(assets.map((a) => [a.id, a])),
    [assets],
  );

  const segments = useMemo(() => parseMentions(content), [content]);

  if (segments.length === 0) return null;

  const resolveAssetUrl = (assetId: string): string | null => {
    const asset = assetMap.get(assetId);
    if (!asset) return null;
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/v1\/?$/, "");
    return asset.url.startsWith("http") ? asset.url : `${baseUrl}${asset.url}`;
  };

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={i}>{seg.content}</span>;
        }

        if (seg.type === "link") {
          return (
            <a
              key={i}
              href={seg.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline underline-offset-2 break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {seg.url}
            </a>
          );
        }

        if (seg.type === "user") {
          return (
            <span
              key={i}
              className="inline-flex items-center bg-primary/10 text-primary rounded px-1 py-0.5 text-xs font-medium mx-0.5"
            >
              @{seg.name}
            </span>
          );
        }

        if (seg.type === "asset") {
          const url = resolveAssetUrl(seg.id);
          return url ? (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-primary hover:underline underline-offset-2 text-xs font-medium mx-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              #{seg.name}
            </a>
          ) : (
            <span
              key={i}
              className="inline-flex items-center text-muted-foreground text-xs font-medium mx-0.5"
            >
              #{seg.name}
            </span>
          );
        }

        return null;
      })}
    </span>
  );
}
