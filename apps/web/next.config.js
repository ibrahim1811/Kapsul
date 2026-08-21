/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@kapsul/types", "@kapsul/firebase", "@kapsul/api", "@kapsul/utils"],
};

module.exports = nextConfig;
