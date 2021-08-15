const BundleTracker = require('webpack-bundle-tracker');

module.exports = {
  // The Webpack config to use when compiling your react app for development or production.
  webpack: function override(config, env) {
    if (!config.plugins) {
      config.plugins = [];
    }

    config.plugins.push(
      (process.env.NODE_ENV === 'production') ?
        new BundleTracker({ path: __dirname, filename: './webpack-stats.prod.json' }) :
        new BundleTracker({
          path: __dirname,
          filename: './webpack-stats.dev.json',
          indent: 2,
          publicPath: process.env.PUBLIC_URL
        })
    );
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
        'Access-Control-Allow-Origin': '*'
      }

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
