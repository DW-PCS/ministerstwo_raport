/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/ReportMI/:path*',
        destination:
          'https://pcscoreapi-h5hvg0dkdxcme7gh.polandcentral-01.azurewebsites.net//ReportMI/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
