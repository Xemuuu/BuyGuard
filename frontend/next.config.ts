import type { NextConfig } from "next";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/api/:path*", // ten port musi pasować do backendu
      },
    ]
  },
}


export default nextConfig;
