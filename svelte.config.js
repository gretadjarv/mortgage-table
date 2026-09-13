import adapter from '@sveltejs/adapter-static';

const config = {
  kit: {
    adapter: {
      name: '@sveltejs/adapter-static',
      pages: 'build',
      assets: 'build',
      fallback: '404.html',
      precompress: false,
      strict: true
    },
    paths: {
      base: process.env.VITE_BASE_PATH || ''
    }
  }
};
export default config;
