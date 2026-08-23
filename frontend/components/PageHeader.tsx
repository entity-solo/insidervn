import type { ReactNode } from "react";

export default function PageHeader({
  eyebrow,
  title,
  sub,
  right,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="feed-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="feed-title" style={{ margin: "2px 0" }}>{title}</h1>
        {sub && <div className="feed-subtitle">{sub}</div>}
      </div>
      {right}
    </div>
  );
}
