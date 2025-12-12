/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  //reactCompiler: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["*.cloudworkstations.dev", "localhost:3000"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", 
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", 
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com", // [!code ++] Added for registration avatars
      },
    ],
  },
};

export default nextConfig;
