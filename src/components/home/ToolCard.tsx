import Image from "next/image";
import Link from "next/link";
import type { HomeFeaturedTool } from "@/lib/home/featuredTools";

type ToolCardProps = {
  tool: HomeFeaturedTool;
};

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <article
      className={`home-feature-card home-feature-card-${tool.spotlight}`}
      aria-labelledby={`feature-${tool.id}`}
    >
      <div className="home-feature-media">
        <Image
          src={tool.imageSrc}
          alt={tool.imageAlt}
          width={tool.imageWidth}
          height={tool.imageHeight}
          className="home-feature-image"
        />
        <div className="home-feature-media-bar">
          <span className="home-feature-category">{tool.category}</span>
          <span className="home-feature-code" aria-hidden="true">
            {tool.shortCode}
          </span>
        </div>
      </div>

      <div className="home-feature-content">
        <div className="home-feature-topline">
          <span className="home-feature-eyebrow">{tool.eyebrow}</span>
          <span className="home-feature-chip">{tool.chipLabel}</span>
        </div>

        <h3 id={`feature-${tool.id}`}>{tool.name}</h3>
        <p>{tool.homeDescription}</p>

        <ul className="home-feature-list" aria-label={`${tool.name} 핵심 포인트`}>
          {tool.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>

        <Link href={tool.href} className="button-link home-feature-action">
          {tool.ctaLabel}
        </Link>
      </div>
    </article>
  );
}
