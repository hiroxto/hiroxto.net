import { List, ListItem, Stack } from '@mantine/core';
import { InternalLink } from '@/components/common/internal-link';
import { SiteSubpageFrame } from '@/components/common/site-subpage-frame';
import {
    trainNumberIndexDescription,
    trainNumberIndexTitle,
    trainNumberPageEntries,
} from '@/lib/train-number/page-config';

export function TrainNumberIndexPage() {
    return (
        <SiteSubpageFrame
            items={[{ label: 'ツール一覧', href: '/tools' }, { label: trainNumberIndexTitle }]}
            title={trainNumberIndexTitle}
            description={trainNumberIndexDescription}
        >
            <Stack gap="lg">
                <section>
                    <List listStyleType="disc" withPadding>
                        {trainNumberPageEntries.map((entry) => (
                            <ListItem key={entry.slug}>
                                <InternalLink href={`/tools/train-number/${entry.slug}`}>{entry.title}</InternalLink>
                            </ListItem>
                        ))}
                    </List>
                </section>
            </Stack>
        </SiteSubpageFrame>
    );
}
