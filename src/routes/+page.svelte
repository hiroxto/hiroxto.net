<script lang="ts">
    import 'carbon-components-svelte/css/g10.css';
    import {
        Header,
        Content,
        Grid,
        Row,
        Column,
        OutboundLink,
        UnorderedList,
        ListItem,
    } from 'carbon-components-svelte';

    const socialLinks = [
        {
            text: 'Twitter (hiroxto)',
            href: 'https://twitter.com/hiroxto',
        },
        {
            text: 'Scrapbox',
            href: 'https://scrapbox.io/hiroxto/',
        },
        {
            text: 'GitHub (hiroxto)',
            href: 'https://github.com/hiroxto',
        },
        {
            text: 'GitLab (hiroxto)',
            href: 'https://gitlab.com/hiroxto',
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
    const blogLinks = [
        {
            text: 'Scrapbox',
            href: 'https://scrapbox.io/hiroxto/',
        },
        {
            text: 'Blog (not active)',
            href: 'https://hiroto-k.hatenablog.com/',
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
                    <p class="page-subtitle">Website of hiroxto</p>
                </Column>
            </Row>

            <Row>
                <Column>
                    <h2>Profile</h2>
                    <h3>Name</h3>
                    <p class="text-2xl" style="display: inline; vertical-align: top">hiroxto</p>

                    <h3>Others</h3>
                    <p class="text">Now writing...</p>
                </Column>
            </Row>

            <hr>

            <Row>
                <Column>
                    <h2>Links</h2>
                    <div class="links">
                        <h3>Social</h3>
                        <UnorderedList>
                            {#each socialLinks as socialLink}
                                <ListItem>
                                    <OutboundLink href="{socialLink.href}" size="lg">
                                        {socialLink.text}
                                    </OutboundLink>
                                </ListItem>
                            {/each}
                        </UnorderedList>
                    </div>

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

                    <div class="links">
                        <h3>Blogs</h3>
                        <UnorderedList native>
                            {#each blogLinks as blogLink}
                                <ListItem>
                                    <OutboundLink href="{blogLink.href}" size="lg">
                                        {blogLink.text}
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

    .page-subtitle {
        font-size: 1.5rem;
    }

    .profile-image {
        width: 10rem;
        height: auto;
        border-radius: 50%;
    }

    .text-2xl {
        font-size: 1.7rem;
    }

    .text {
        font-size: 1.1rem;
    }

    .links {
        padding-bottom: 1rem;
    }
</style>
