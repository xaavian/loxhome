import type { Reroute } from '@sveltejs/kit';

export const reroute: Reroute = ({ url }) => {
    // HA serves the iframe at /local/loxhome/index.html
    // SvelteKit strips the base path and sees /index.html
    // Reroute that to / so the root route matches
    if (url.pathname.endsWith('/index.html')) {
        return '/';
    }
};
