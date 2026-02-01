<script lang="ts">
import 'carbon-components-svelte/css/g10.css';
import { Column, Content, Grid, Header, ListItem, OutboundLink, Row, UnorderedList } from 'carbon-components-svelte';

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
</script>

<main>
    <Header platformName="hiroxto.net">
    </Header>

    <Content>
        <Grid>
            <Row>
                <Column>
                    <h1 class="page-title">hiroxto.net</h1>
                </Column>
            </Row>

            <Row>
                <Column>
                    <h2>Profile</h2>
                    {#each profiles as profile}
                        <p class="text">
                            {#if profile.linkTo == null}
                                {profile.key}: {profile.value}
                            {:else}
                                {profile.key}:
                                <OutboundLink href="{profile.linkTo}" size="lg">
                                    {profile.value}
                                </OutboundLink>
                            {/if}
                        </p>
                    {/each}
                </Column>
            </Row>

            <hr>

            <Row>
                <Column>
                    <h2>Others</h2>

                    <div class="links">
                        <h3>Subdomains</h3>
                        <UnorderedList>
                            {#each subdomainLinks as subdomainLink}
                                <ListItem>
                                    <OutboundLink href="{subdomainLink.href}" size="lg">
                                        {subdomainLink.text}
                                    </OutboundLink>
                                </ListItem>
                            {/each}
                        </UnorderedList>
                    </div>
                </Column>
            </Row>

        </Grid>
    </Content>
</main>

<style>
    .page-title {
        font-size: 2.6rem;
    }

    .text {
        font-size: 1.1rem;
    }

    .links {
        padding-bottom: 1rem;
    }
</style>
