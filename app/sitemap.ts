import type { MetadataRoute } from 'next';
import { getRequestOrigin } from '@/lib/metadata/request-origin';

const sitemapEntries = [
    { path: '/', changeFrequency: 'yearly', priority: 1 },
    { path: '/tools', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/tools/cl-sound', changeFrequency: 'yearly', priority: 0.8 },
    { path: '/tools/epgs-recorded-name', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/tools/fare-ticket-route-planner', changeFrequency: 'yearly', priority: 0.8 },
    { path: '/tools/fare-ticket-route-planner/states', changeFrequency: 'yearly', priority: 0.4 },
    { path: '/tools/qr-code-gen', changeFrequency: 'yearly', priority: 0.8 },
    { path: '/tools/swarm-checkin-regulation-checker', changeFrequency: 'yearly', priority: 0.8 },
    { path: '/tools/train-number-calc', changeFrequency: 'yearly', priority: 0.8 },
    { path: '/tools/train-number', changeFrequency: 'yearly', priority: 0.2 },
    { path: '/tools/train-number/2018-03-17', changeFrequency: 'yearly', priority: 0.6 },
    { path: '/tools/train-number/2019-03-16', changeFrequency: 'yearly', priority: 0.6 },
    { path: '/tools/train-number/2020-03-14', changeFrequency: 'yearly', priority: 0.6 },
    { path: '/tools/train-number/2021-03-13', changeFrequency: 'yearly', priority: 0.6 },
] satisfies Array<{
    path: string;
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
    priority: number;
}>;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const origin = await getRequestOrigin();

    return sitemapEntries.map((entry) => ({
        url: new URL(entry.path, origin).toString(),
        changeFrequency: entry.changeFrequency,
        priority: entry.priority,
    }));
}
