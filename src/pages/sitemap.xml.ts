import type { APIRoute } from 'astro';
import workoutsData from '../data/workouts.json';
import { SITE_CONFIG, type Workout } from '../config/site';

export const GET: APIRoute = () => {
  const workouts = workoutsData as Workout[];
  const urls = [
    `${SITE_CONFIG.url}/`,
    ...workouts.map((w) => `${SITE_CONFIG.url}/workouts/${w.slug}`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${url === `${SITE_CONFIG.url}/` ? '1.0' : '0.8'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
