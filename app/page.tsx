import { Anchor, Divider, List, ListItem, Stack, Text, Title } from '@mantine/core';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { InternalLink } from '@/components/common/internal-link';
import { SitePageFrame } from '@/components/common/site-page-frame';

interface Profile {
    key: string;
    value: string;
    linkTo?: string;
}

const profiles: Profile[] = [
    {
        key: 'Name',
        value: 'hiroxto',
    },
    {
        key: 'Job',
        value: 'Software Engineer (Server Side Engineer)',
    },
    {
        key: 'GitHub',
        value: 'hiroxto',
        linkTo: 'https://github.com/hiroxto',
    },
    {
        key: 'Twitter',
        value: '@hiroxto',
        linkTo: 'https://twitter.com/hiroxto',
    },
    {
        key: 'Scrapbox',
        value: 'hiroxto',
        linkTo: 'https://scrapbox.io/hiroxto/',
    },
];

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Anchor href={href} target="_blank" rel="noreferrer noopener">
            {children}
        </Anchor>
    );
}

export const metadata: Metadata = {
    description: 'hiroxto.net',
};

export default function HomePage() {
    return (
        <SitePageFrame>
            <Stack gap="xl">
                <Title order={1}>hiroxto.net</Title>

                <section>
                    <Title order={2}>Profile</Title>
                    <Stack gap={4} mt="sm">
                        {profiles.map((profile) => (
                            <Text key={profile.key}>
                                {profile.linkTo == null ? (
                                    `${profile.key}: ${profile.value}`
                                ) : (
                                    <>
                                        {profile.key}:{' '}
                                        <ExternalLink href={profile.linkTo}>{profile.value}</ExternalLink>
                                    </>
                                )}
                            </Text>
                        ))}
                    </Stack>
                </section>

                <Divider />

                <section>
                    <Title order={2}>Others</Title>
                    <Title order={3} mt="sm">
                        Tools
                    </Title>
                    <List listStyleType="disc" withPadding mt={6}>
                        <ListItem>
                            <InternalLink href="/tools">ツール一覧</InternalLink>
                        </ListItem>
                    </List>
                </section>
            </Stack>
        </SitePageFrame>
    );
}
