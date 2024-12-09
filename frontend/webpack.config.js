const webpack = require("webpack");

module.exports = {
  resolve: {
    fallback: {
      process: require.resolve("process"),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
  ],
};
