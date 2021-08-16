const BundleTracker = require("webpack-bundle-tracker");
var DuplicatePackageCheckerPlugin = require("duplicate-package-checker-webpack-plugin");
const webpack = require("webpack");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
// const removeWebpackPlugins = require("react-app-rewire-unplug");
// const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

module.exports = {
  // The Webpack config to use when compiling your react app for development or production.
  webpack: function override(config, env) {
    // console.log(process.env.FAST_REFRESH);
    // console.log(config.entry);
    // if (process.env.NODE_ENV === 'development' && process.env.FAST_REFRESH === 'false') {
    //
    //   config.entry = [
    //     require.resolve('webpack-dev-server/client') + `?${process.env.PUBLIC_URL}/`,
    //     require.resolve('webpack/hot/dev-server'),
    //     config.entry[config.entry.length - 1]
    //   ];
    // }

    if (!config.plugins) {
      config.plugins = [];
    }

    // config = removeWebpackPlugins(config, env, {
    //   pluginNames: ["ReactRefreshPlugin"],
    //   verbose: true
    // });
    //
    // const webpackDevClientEntry = require.resolve(
    //   "react-dev-utils/webpackHotDevClient"
    // );
    // const reactRefreshOverlayEntry = require.resolve(
    //   "react-dev-utils/refreshOverlayInterop"
    // );

    config.plugins.push(...[
      (process.env.NODE_ENV === "production") ?
        new BundleTracker({ path: __dirname, filename: "./webpack-stats.prod.json" }) :
        new BundleTracker({
          path: __dirname,
          filename: "./webpack-stats.dev.json",
          indent: 2,
          publicPath: process.env.PUBLIC_URL
        }),

      process.env.NODE_ENV === "production" && new DuplicatePackageCheckerPlugin({ verbose: true }),
      process.env.NODE_ENV === "production" && new webpack.optimize.AggressiveMergingPlugin(),//Merge chunks
      process.env.NODE_ENV === "production" && new BundleAnalyzerPlugin({
        analyzerMode: "static"
      }),
      // env === "development" && new ReactRefreshWebpackPlugin({
      //   overlay: {
      //     entry: webpackDevClientEntry,
      //     // The expected exports are slightly different from what the overlay exports,
      //     // so an interop is included here to enable feedback on module-level errors.
      //     module: reactRefreshOverlayEntry,
      //     // Since we ship a custom dev client and overlay integration,
      //     // the bundled socket handling logic can be eliminated.
      //     sockIntegration: false,
      //     sockPort: 3000,
      //   }
      // })
    ].filter(Boolean));
    return config;
  },
  // The Jest config to use when running your jest tests - note that the normal rewires do not
  // work here.
  jest: function(config) {
    // ...add your jest config customisation...
    return config;
  },
  // The function to use to create a webpack dev server configuration when running the development
  // server with 'npm run start' or 'yarn start'.
  devServer: function(configFunction) {
    // Return the replacement function for create-react-app to use to generate the Webpack
    // Development Server config. "configFunction" is the function that would normally have
    // been used to generate the Webpack Development server config - you can use it to create
    // a starting configuration to then modify instead of having to create a config from scratch.
    return function(proxy, allowedHost) {
      // Create the default config by calling configFunction with the proxy/allowedHost parameters
      const config = configFunction(proxy, allowedHost);

      config.headers = {
        "Access-Control-Allow-Origin": "*"
      };

      // Return your customised Webpack Development Server config.
      return config;
    };
  },
  // The paths config to use when compiling your react app for development or production.
  paths: function(paths, env) {
    // ...add your paths config
    return paths;
  },

}
