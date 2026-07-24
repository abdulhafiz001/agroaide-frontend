/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: 'AgroAide',
  slug: 'AgroAide',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/agroaideLogo.png',
  scheme: 'agroaide',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.ahz.agroaide',
  },
  android: {
    package: 'com.ahz.agroaide',
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/agroaideLogo.png',
      backgroundImage: './assets/images/agroaideLogo.png',
      monochromeImage: './assets/images/agroaideLogo.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
    ],
  },
  web: {
    output: 'static',
    favicon: './assets/images/agroaideLogo.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/agroaideLogo.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          backgroundColor: '#000000',
        },
      },
    ],
    'expo-audio',
    'expo-asset',
    [
      'expo-notifications',
      {
        icon: './assets/images/agroaideLogo.png',
        color: '#57b346',
        defaultChannel: 'default',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Allow AgroAide to use your location to set your farm coordinates.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  owner: 'abdulhafiz01',
  extra: {
    router: {},
    eas: {
      projectId: 'fd9daaf2-bb7c-4abd-abd3-b4eb92917755',
    },
  },
};

module.exports = { expo: config };
