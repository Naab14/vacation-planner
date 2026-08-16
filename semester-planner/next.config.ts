import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The deployable app is this subdirectory, not the legacy Vite app at repo root.
  outputFileTracingRoot: path.join(__dirname),
  // argon2 is a native module; keep it external to the server bundle.
  serverExternalPackages: ['argon2'],
};

export default nextConfig;
