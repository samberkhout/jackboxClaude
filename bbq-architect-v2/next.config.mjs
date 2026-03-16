/** @type {import('next').NextConfig} */
var nextConfig = {
    images: {
        remotePatterns: [
            {
                // Cloudinary CDN
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '/**',
            },
            {
                // Supabase Storage (elke project-subdomain)
                protocol: 'https',
                hostname: '*.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },
};

export default nextConfig;
