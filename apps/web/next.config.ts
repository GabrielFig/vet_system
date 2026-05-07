import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@vet/shared-types', '@vet/utils'],
};

export default nextConfig;
