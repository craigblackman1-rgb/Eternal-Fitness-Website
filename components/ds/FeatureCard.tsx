import Image from "next/image";
import Link from "next/link";
import type { Accent, IconComponent } from "./types";

interface FeatureCardProps {
  title: string;
  body: string;
  /** icon-badge variant */
  icon?: IconComponent;
  accent?: Accent;
  /** image-card variant (top image) */
  image?: string;
  imageAlt?: string;
  href?: string;
}

/**
 * Two variants of the homepage card language:
 *  - icon variant (.ds-card + icon badge, mirrors .aq)
 *  - image variant (.ds-imgcard, mirrors .wc)
 */
export function FeatureCard({ title, body, icon: Icon, accent = "teal", image, imageAlt, href }: FeatureCardProps) {
  if (image) {
    const media = (
      <>
        <div className="ds-imgcard-media">
          <Image src={image} alt={imageAlt ?? title} fill sizes="(max-width: 1000px) 100vw, 33vw" style={{ objectFit: "cover" }} />
        </div>
        <div className="ds-imgcard-body">
          <h3>{title}</h3>
          <p>{body}</p>
        </div>
      </>
    );
    return href ? (
      <Link href={href} className="ds-imgcard">{media}</Link>
    ) : (
      <div className="ds-imgcard">{media}</div>
    );
  }

  const inner = (
    <>
      {Icon && (
        <div className={`ds-card-ic ds-card-ic-${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <h4 className="ds-card-title">{title}</h4>
      <p className="ds-card-body">{body}</p>
    </>
  );
  return href ? (
    <Link href={href} className="ds-card">{inner}</Link>
  ) : (
    <div className="ds-card">{inner}</div>
  );
}

export default FeatureCard;
