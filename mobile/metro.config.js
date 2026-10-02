const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer/expo");
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "svg");
config.resolver.sourceExts.push("svg");

// Portal authentication requires browser API calls to stay on the app's origin.
if (process.env.DEV_API_PROXY_URL) {
  const proxy = require("http-proxy").createProxyServer({
    target: process.env.DEV_API_PROXY_URL,
    changeOrigin: true,
  });
  proxy.on("error", (_error, _request, response) => {
    response.writeHead(502, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ detail: "Development API is unavailable" }));
  });
  config.server.enhanceMiddleware = (middleware) => (request, response, next) => {
    const path = request.url.split("?")[0];
    if (path.startsWith("/api/") || ["/health", "/docs", "/openapi.json"].includes(path)) {
      proxy.web(request, response);
    } else {
      middleware(request, response, next);
    }
  };
}

module.exports = config;
