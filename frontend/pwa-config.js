/**
 * @type {import('next-pwa').PWAConfig}
 */
const withPWAConfig = {
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  sw: 'sw.js',
  publicExclusions: ['!noprecache/**/*'],
  buildExclusions: [
    /middleware-manifest.json$/,
    /_ssgManifest.js$/,
    /\.map$/,
    /hot-update/,
    /BUILD_ID/,
  ],
};

module.exports = withPWAConfig;
