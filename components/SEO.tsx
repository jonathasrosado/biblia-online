import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
    title: string;
    description: string;
    image?: string;
    url?: string;
    type?: string;
    keywords?: string;
    schema?: any;
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    image = '/og-default.jpg', // You might want to ensure this file exists or use a remote URL
    url,
    type = 'website',
    keywords = 'Bíblia, Estudo Bíblico, Deus, Jesus, Versículo do Dia, Inteligência Artificial, Teologia, Devocional',
    schema
}) => {
    const location = useLocation();
    const siteTitle = "Bíblia Online";

    // Smart title generation: avoid duplicating the site title if it's already present
    let fullTitle = title;
    // Check if title is exactly the site title OR if it already contains the site title (to prevent "Title | Site Name | Site Name")
    // Also explicitly checking for the long home page title format just in case
    if (title !== siteTitle && !title.includes(siteTitle) && !title.includes('Bíblia Online')) {
        fullTitle = `${title} | ${siteTitle}`;
    }

    // Construct absolute URL
    const baseUrl = 'https://bibliaonline.me';
    const absoluteUrl = url ? (url.startsWith('http') ? url : `${baseUrl}${url}`) : `${baseUrl}${location.pathname}`;
    const absoluteImage = image.startsWith('http') ? image : `${baseUrl}${image}`;

    return (
        <Helmet>
            {/* Meta Tags Básicas */}
            <meta charSet='UTF-8' />
            <meta name='viewport' content='width=device-width, initial-scale=1.0' />
            <title>{fullTitle}</title>
            <meta name='description' content={description.substring(0, 160)} />
            <meta name='keywords' content={keywords} />
            <meta name='author' content='Bíblia Online' />

            {/* Open Graph (Redes Sociais) */}
            <meta property='og:title' content={fullTitle} />
            <meta property='og:description' content={description} />
            <meta property='og:image' content={absoluteImage} />
            <meta property='og:url' content={absoluteUrl} />
            <meta property='og:type' content={type} />
            <meta property='og:site_name' content={siteTitle} />

            {/* Twitter Card */}
            <meta name='twitter:card' content='summary_large_image' />
            <meta name='twitter:title' content={fullTitle} />
            <meta name='twitter:description' content={description} />
            <meta name='twitter:image' content={absoluteImage} />

            {/* Canonical URL */}
            <link rel='canonical' href={absoluteUrl} />

            {/* Schema Markup (JSON-LD) */}
            {schema && (
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
