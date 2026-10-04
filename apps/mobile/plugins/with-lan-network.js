// Expo loads this config plugin through CommonJS during prebuild.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

// Synco's current transport uses ws:// on user-selected private LAN addresses.
// Debug manifests allow this implicitly; standalone builds need it explicitly.
module.exports = function withLanNetwork(config) {
  return withAndroidManifest(config, config => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    application.$['android:usesCleartextTraffic'] = 'true';
    return config;
  });
};
