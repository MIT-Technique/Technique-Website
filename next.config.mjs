/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: "/preorder",
        destination: "https://mit.universitytickets.com/w/event.aspx?id=2127",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
