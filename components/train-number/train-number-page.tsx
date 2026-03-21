import { Stack } from '@mantine/core';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import { renderTrainNumberMarkdown } from '@/lib/train-number/marked';
import { trainNumberIndexTitle } from '@/lib/train-number/page-config';

interface TrainNumberPageProps {
    title: string;
    markdownSource: string;
}

const contentClassName = [
    '[&_h1]:text-3xl',
    '[&_h1]:font-bold',
    '[&_h1]:leading-tight',
    '[&_h2]:mt-8',
    '[&_h2]:text-2xl',
    '[&_h2]:font-semibold',
    '[&_h3]:mt-6',
    '[&_h3]:text-xl',
    '[&_h3]:font-semibold',
    '[&_h4]:mt-5',
    '[&_h4]:text-lg',
    '[&_h4]:font-semibold',
    '[&_p]:mt-3',
    '[&_ul]:mt-3',
    '[&_ul]:list-disc',
    '[&_ul]:pl-6',
    '[&_li]:mt-1',
    '[&_a]:text-blue-700',
    '[&_a]:underline',
    '[&_a]:underline-offset-2',
    '[&_code]:rounded',
    '[&_code]:bg-gray-100',
    '[&_code]:px-1',
    '[&_code]:py-0.5',
].join(' ');

export function TrainNumberPage({ title, markdownSource }: TrainNumberPageProps) {
    const html = renderTrainNumberMarkdown(markdownSource);

    return (
        <SiteSubpageFrame
            items={[
                { label: 'ツール一覧', href: '/tools' },
                { label: trainNumberIndexTitle, href: '/tools/train-number' },
                { label: title },
            ]}
            title={title}
            description={`列車番号メモ ${title}`}
        >
            <Stack gap="lg">
                <section>
                    {/* biome-ignore lint/security/noDangerouslySetInnerHtml: 同梱した固定 Markdown を marked で描画するため */}
                    <article className={contentClassName} dangerouslySetInnerHTML={{ __html: html }} />
                </section>
            </Stack>
        </SiteSubpageFrame>
    );
}
