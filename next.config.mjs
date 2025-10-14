/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: "/portrait",
        destination:
          "https://seniors.legacystudios.com/massachusetts-institute-technology-cambridge-ma/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
