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
      {
        source: "/submission",
        destination: "https://forms.gle/D6bw7LksKv94Y3Pd8",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
