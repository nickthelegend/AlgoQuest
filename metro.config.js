const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-qrcode-svg/textEncodingTransformation")
  };

  return config;
})();