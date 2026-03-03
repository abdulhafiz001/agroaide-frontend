module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Transform import.meta so it works in web bundles (Metro doesn't support it natively)
          unstable_transformImportMeta: true,
        },
      ],
    ],
  };
};
