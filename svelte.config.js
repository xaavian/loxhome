import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'custom_components/loxhome/frontend',
			assets: 'custom_components/loxhome/frontend',
			fallback: 'index.html',
			precompress: false,
			strict: true
		}),
		paths: {
			base: '/loxhome_static'
		}
	}
};

export default config;

