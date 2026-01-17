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
      {
        source: "/purchase",
        destination: "https://engage.mit.edu/technique/rsvp_boot?id=916938",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
