import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: 'tsconfig.build.json',
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  // output: 'standalone',
  serverExternalPackages: ['ffmpeg-static'],
  outputFileTracingIncludes: {
    '/api/hermes/tasks': ['node_modules/ffmpeg-static/**/*'],
  },
  outputFileTracingExcludes: process.env.VERCEL
    ? {
        '/api/hermes/tasks': [
          'integrations/genvid/**/*',
          '.tmp/hermes-runtime-*-test-*.json',
          '.tmp/hermes-runtime-settings-test-*.json',
        ],
      }
    : undefined,
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
