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
      {
        protocol: "https",
        hostname: "pub-07d8598045444efc9676b80f08ab88fe.r2.dev",
      },
    ],
  },
};

export default nextConfig;
