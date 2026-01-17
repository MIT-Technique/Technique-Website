import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/en",
        permanent: false,
      },
      {
        source: "/portrait",
        destination:
          "https://seniors.legacystudios.com/massachusetts-institute-technology-cambridge-ma/",
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
