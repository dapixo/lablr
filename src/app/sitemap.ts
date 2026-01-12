import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://lalabel.app'
  const lastModified = new Date()

  return [
    // Pages principales
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          fr: `${baseUrl}/fr`,
          en: `${baseUrl}/en`,
          es: `${baseUrl}/es`,
        },
      },
    },
    {
      url: `${baseUrl}/fr`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/en`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/es`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },

    // Pages pricing
    {
      url: `${baseUrl}/fr/pricing`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/en/pricing`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/es/pricing`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // Note : Les pages /account et /login sont exclues du sitemap
    // car elles ont robots: { index: false } dans leurs métadonnées
  ]
}
