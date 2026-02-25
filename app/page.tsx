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
        <div className="bx--link__icon">
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
        </div>
    );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <a className="bx--link bx--link--lg" href={href} target="_blank" rel="noreferrer noopener">
            {children} <ExternalLinkIcon />
        </a>
    );
}

export default function HomePage() {
    return (
        <div>
            <header className="bx--header">
                <a className="bx--header__name" href="/">
                    hiroxto.net
                </a>
            </header>

            <main className="bx--content">
                <div className="bx--grid">
                    <div className="bx--row">
                        <div className="bx--col">
                            <h1 className="page-title">hiroxto.net</h1>
                        </div>
                    </div>

                    <div className="bx--row">
                        <div className="bx--col">
                            <h2>Profile</h2>
                            {profiles.map((profile) => (
                                <p key={profile.key} className="text">
                                    {profile.linkTo == null ? (
                                        `${profile.key}: ${profile.value}`
                                    ) : (
                                        <>
                                            {profile.key}:{' '}
                                            <ExternalLink href={profile.linkTo}>{profile.value}</ExternalLink>
                                        </>
                                    )}
                                </p>
                            ))}
                        </div>
                    </div>

                    <hr />

                    <div className="bx--row">
                        <div className="bx--col">
                            <h2>Others</h2>

                            <div className="links">
                                <h3>Subdomains</h3>
                                <ul className="bx--list--unordered">
                                    {subdomainLinks.map((subdomainLink) => (
                                        <li key={subdomainLink.href} className="bx--list__item">
                                            <ExternalLink href={subdomainLink.href}>{subdomainLink.text}</ExternalLink>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
