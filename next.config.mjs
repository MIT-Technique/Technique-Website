import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.join(__dirname, "src"),
    };
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/en",
        destination: "/",
        permanent: false,
      },
      {
        source: "/en/:path*",
        destination: "/:path*",
        permanent: false,
      },
      {
        source: "/portrait",
        destination:
          "https://seniors.legacystudios.com/massachusetts-institute-technology-cambridge-ma/",
        permanent: false,
      },
      {
        source: "/es/:path*",
        destination: "/:path*",
        permanent: false,
      },
      {
        source: "/zh/:path*",
        destination: "/:path*",
        permanent: false,
      },
      {
        source: "/purchase",
        destination: "https://engage.mit.edu/technique/rsvp_boot?id=916938",
        permanent: false,
      },
      {
        source: "/admin",
        destination: "/login/admin",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
