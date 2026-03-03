const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix "Cannot use 'import.meta' outside a module" on web.
// 1) Disable package.json exports so Metro uses CommonJS entries
config.resolver.unstable_enablePackageExports = false;

// 2) Force zustand and @lottiefiles/dotlottie-react to CommonJS (they use import.meta in ESM)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'zustand' ||
    moduleName.startsWith('zustand/') ||
    moduleName === '@lottiefiles/dotlottie-react' ||
    moduleName.startsWith('@lottiefiles/dotlottie-react/')
  ) {
    try {
      return { type: 'sourceFile', filePath: require.resolve(moduleName) };
    } catch (_e) {
      /* fall through */
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
