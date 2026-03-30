/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.smartmobileservice5g.co.in",
      },
      {
        protocol: "https",
        hostname: "api-smart-mobile-service.onrender.com",
      },
    ],
  },
};

export default nextConfig;
