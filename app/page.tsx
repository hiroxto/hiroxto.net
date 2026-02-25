import { Anchor, Container, Divider, List, ListItem, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

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
        key: 'GitLab',
        value: 'hiroxto',
        linkTo: 'https://gitlab.com/hiroxto',
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
    {
        key: 'Blog (not active)',
        value: 'Blog (not active)',
        linkTo: 'https://hiroto-k.hatenablog.com/',
    },
    {
        key: 'Qiita (not used)',
        value: 'hiroxto',
        linkTo: 'https://qiita.com/hiroxto',
    },
    {
        key: 'Zenn (not used)',
        value: 'hiroxto',
        linkTo: 'https://zenn.dev/hiroxto',
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

function ExternalLinkIcon() {
    return (
        <span className="external-link-icon" aria-hidden="true">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                fill="currentColor"
                preserveAspectRatio="xMidYMid meet"
                width="16"
                height="16"
                aria-hidden="true"
            >
                <path d="M26,28H6a2.0027,2.0027,0,0,1-2-2V6A2.0027,2.0027,0,0,1,6,4H16V6H6V26H26V16h2V26A2.0027,2.0027,0,0,1,26,28Z" />
                <path d="M20 2L20 4 26.586 4 18 12.586 19.414 14 28 5.414 28 12 30 12 30 2 20 2z" />
            </svg>
        </span>
    );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Anchor className="external-link" href={href} target="_blank" rel="noreferrer noopener">
            {children} <ExternalLinkIcon />
        </Anchor>
    );
}

export default function HomePage() {
    return (
        <div className="page-root">
            <header className="site-header">
                <a className="site-header-name" href="/">
                    hiroxto.net
                </a>
            </header>

            <main className="site-content">
                <Container size="lg" className="page-container">
                    <Stack gap="xl">
                        <Title order={1} className="page-title">
                            hiroxto.net
                        </Title>

                        <section>
                            <Title order={2}>Profile</Title>
                            <Stack gap={4} mt="sm">
                                {profiles.map((profile) => (
                                    <Text key={profile.key} className="text">
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

                        <section className="links">
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
            </main>
        </div>
    );
}
