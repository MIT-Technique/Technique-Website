/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: "/order",
        destination: "https://mit.universitytickets.com/w/event.aspx?id=2196",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
