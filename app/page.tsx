import { Column, Content, Grid, Header, Link, ListItem, Row, UnorderedList } from '@carbon/react';

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

export default function HomePage() {
    return (
        <main>
            <Header aria-label="hiroxto.net" />

            <Content>
                <Grid>
                    <Row>
                        <Column>
                            <h1 className="page-title">hiroxto.net</h1>
                        </Column>
                    </Row>

                    <Row>
                        <Column>
                            <h2>Profile</h2>
                            {profiles.map((profile) => (
                                <p key={profile.key} className="text">
                                    {profile.linkTo == null ? (
                                        `${profile.key}: ${profile.value}`
                                    ) : (
                                        <>
                                            {profile.key}:{' '}
                                            <Link href={profile.linkTo} target="_blank" rel="noreferrer noopener">
                                                {profile.value}
                                            </Link>
                                        </>
                                    )}
                                </p>
                            ))}
                        </Column>
                    </Row>

                    <hr />

                    <Row>
                        <Column>
                            <h2>Others</h2>

                            <div className="links">
                                <h3>Subdomains</h3>
                                <UnorderedList>
                                    {subdomainLinks.map((subdomainLink) => (
                                        <ListItem key={subdomainLink.href}>
                                            <Link href={subdomainLink.href} target="_blank" rel="noreferrer noopener">
                                                {subdomainLink.text}
                                            </Link>
                                        </ListItem>
                                    ))}
                                </UnorderedList>
                            </div>
                        </Column>
                    </Row>
                </Grid>
            </Content>
        </main>
    );
}
