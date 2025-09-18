/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Increase Webpack's chunk load timeout to reduce dev-time ChunkLoadError timeouts
  webpack: (config) => {
    config.output = config.output || {};
    // Default is 120000ms; bump to 240000ms to tolerate slow networks/extensions
    config.output.chunkLoadTimeout = 240000;
    return config;
  },
};

export default nextConfig;
