import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from external domains if needed in future
  images: {
    localPatterns: [
      {
        pathname: "/**",
        search: "",
      },
      {
        pathname: "/api/media",
      },
    ],
    remotePatterns: [
      { protocol: "http", hostname: "**" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
