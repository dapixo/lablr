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

    // Pages compte et authentication
    {
      url: `${baseUrl}/fr/account`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/en/account`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/fr/login`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/en/login`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
