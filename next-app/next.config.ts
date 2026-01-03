import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Transpile BlockSuite packages to fix ESM compatibility
  transpilePackages: [
    "@blocksuite/presets",
    "@blocksuite/store",
    "@blocksuite/blocks",
    "@blocksuite/affine-model",
    "@blocksuite/affine-block-surface",
    "@blocksuite/affine-components",
    "@blocksuite/data-view",
    "@blocksuite/icons",
    "@blocksuite/inline",
    "@blocksuite/block-std",
    "@blocksuite/global",
  ],

  // Empty turbopack config to silence warning when using webpack
  turbopack: {},

  // Webpack configuration for BlockSuite ESM compatibility
  // Note: Icon typo bug (CheckBoxCkeckSolidIcon) is fixed via patch-package in patches/
  webpack: (config) => {
    // Preserve existing aliases
    config.resolve.alias = {
      ...config.resolve.alias,
    };

    // Fix ESM module resolution for BlockSuite packages
    // Required because BlockSuite uses ESM with .js extensions
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules\/@blocksuite/,
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
};

export default nextConfig;
