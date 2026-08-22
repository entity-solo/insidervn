import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://insidervn.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/discover", "/stock", "/watchlist", "/about"];
  return routes.map((r) => ({
    url: `${SITE}${r}`,
    lastModified: new Date(),
    changeFrequency: r === "" || r === "/discover" ? "daily" : "weekly",
    priority: r === "" ? 1 : 0.7,
  }));
}
