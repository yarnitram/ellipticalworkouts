import type { APIRoute } from 'astro';
import workoutsData from '../data/workouts.json';
import machinesData from '../data/machines.json';
import { SITE_CONFIG, type Workout, type MachineReview } from '../config/site';

export const GET: APIRoute = () => {
  const workouts = workoutsData as Workout[];
  const machines = machinesData as MachineReview[];

  const urls = [
    { loc: `${SITE_CONFIG.url}/`, priority: '1.0' },
    { loc: `${SITE_CONFIG.url}/equipment`, priority: '0.9' },
    ...workouts.map((w) => ({ loc: `${SITE_CONFIG.url}/workouts/${w.slug}`, priority: '0.8' })),
    ...machines.map((m) => ({ loc: `${SITE_CONFIG.url}/equipment/${m.slug}`, priority: '0.8' })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (item) => `  <url>
    <loc>${item.loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>${item.priority}</priority>
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
