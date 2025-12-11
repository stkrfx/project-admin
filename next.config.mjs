/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["*.cloudworkstations.dev", "localhost:3000"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // For Google Profile Images
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // For your dashboard images
      },
    ],
  },
};

export default nextConfig;
