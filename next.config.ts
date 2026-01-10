import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Handle FBX files
    config.module.rules.push({
      test: /\.fbx$/,
      type: "asset/resource",
    });
    return config;
  },
  // Serve FBX files with correct MIME type
  async headers() {
    return [
      {
        source: "/:path*.fbx",
        headers: [
          {
            key: "Content-Type",
            value: "application/octet-stream",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
