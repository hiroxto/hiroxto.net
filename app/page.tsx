import { Anchor, Container, Divider, List, ListItem, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';
import type {Metadata} from "next";

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

const subdomainLinks = [
    {
        text: 'utils.hiroxto.net',
        href: 'https://utils.hiroxto.net/',
    },
    {
        text: 'swarm-checkin-regulation-checker.hiroxto.net',
        href: 'https://swarm-checkin-regulation-checker.hiroxto.net/',
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
        <div className="page-root">
            <Container size="lg">
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
                            Subdomains
                        </Title>
                        <List listStyleType="disc" withPadding mt={6}>
                            {subdomainLinks.map((subdomainLink) => (
                                <ListItem key={subdomainLink.href}>
                                    <ExternalLink href={subdomainLink.href}>{subdomainLink.text}</ExternalLink>
                                </ListItem>
                            ))}
                        </List>
                    </section>
                </Stack>
            </Container>
        </div>
    );
}
