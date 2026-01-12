# 🖼️ Guide d'Optimisation Images - Lalabel

**Date** : 2026-01-06
**Objectif** : Core Web Vitals optimaux + SEO Images

---

## 📋 Images Requises (Priorité Haute)

### Images Manquantes Critiques

```
public/
├── og-image.jpg          # 1200×630px - Open Graph (réseaux sociaux)
├── logo.png              # 512×512px - Logo HD
├── favicon.ico           # 32×32px - Navigateur
├── icon-192.png          # 192×192px - PWA Android
├── icon-512.png          # 512×512px - PWA Android HD
├── apple-touch-icon.png  # 180×180px - iOS Home Screen
└── og-image-en.jpg       # 1200×630px - Open Graph anglais (optionnel)
```

---

## 🎨 Spécifications par Image

### 1. og-image.jpg (Open Graph)
**Dimensions** : 1200×630px (ratio 1.91:1)
**Format** : JPG optimisé
**Poids cible** : <200KB
**Usage** : Facebook, LinkedIn, Twitter, WhatsApp

**Contenu suggéré** :
```
┌─────────────────────────────────────┐
│  Logo Lalabel (coin haut gauche)    │
│                                     │
│  [Screenshot app avec étiquettes]  │
│                                     │
│  "Générateur d'Étiquettes Gratuit" │
│  "Amazon · Shopify · eBay"         │
│                                     │
│  lalabel.app                        │
└─────────────────────────────────────┘
```

**Commande de création** (avec Figma/Canva) :
1. Canvas 1200×630px
2. Fond : Gradient bleu (#3b82f6 → #60a5fa)
3. Screenshot app (centré, 800×400px)
4. Titre : 48px bold, blanc
5. Sous-titre : 32px medium, blanc 80%

**Export** :
```bash
# Optimisation JPG
convert og-image.png -quality 85 -strip public/og-image.jpg
```

---

### 2. logo.png (Logo HD)
**Dimensions** : 512×512px (carré)
**Format** : PNG avec transparence
**Poids cible** : <50KB
**Usage** : Schema.org, partages sociaux

**Design** :
- Version simplifiée du logo (sans texte)
- Fond transparent
- Icône centrée, 400×400px dans canvas 512×512px
- Marges 56px de chaque côté

**Export** :
```bash
# Optimisation PNG
pngquant --quality=80-95 logo.png -o public/logo.png
```

---

### 3. favicon.ico (Navigateur)
**Dimensions** : 32×32px (multi-sizes: 16×16, 32×32, 48×48)
**Format** : ICO multi-résolution
**Poids cible** : <10KB

**Design** :
- Lettre "L" stylisée ou icône étiquette minimaliste
- Couleurs : Bleu (#3b82f6) + Blanc

**Création** :
```bash
# Avec ImageMagick
convert logo-32.png logo-16.png -colors 256 public/favicon.ico
```

**Alternative** : Utiliser https://realfavicongenerator.net/

---

### 4. icon-192.png & icon-512.png (PWA)
**Dimensions** : 192×192px et 512×512px
**Format** : PNG avec transparence
**Poids cible** : <30KB (192px), <80KB (512px)
**Usage** : Android Home Screen, PWA install

**Design** :
- Même logo que logo.png
- Fond transparent ou blanc
- Support "maskable" (safe zone 80%)

**Safe zone maskable** :
```
┌─────────────────────┐
│  Padding 10%        │
│  ┌───────────────┐  │
│  │               │  │ ← Zone sûre (80%)
│  │     LOGO      │  │ ← Contenu ici
│  │               │  │
│  └───────────────┘  │
│                     │
└─────────────────────┘
```

**Export** :
```bash
# 192px
convert logo.png -resize 192x192 -strip public/icon-192.png

# 512px
convert logo.png -resize 512x512 -strip public/icon-512.png
```

---

### 5. apple-touch-icon.png (iOS)
**Dimensions** : 180×180px
**Format** : PNG sans transparence
**Poids cible** : <50KB
**Usage** : iOS Home Screen

**Design** :
- Fond coloré (pas transparent, iOS ajoute coins arrondis)
- Logo centré, 140×140px
- Marges 20px

**Export** :
```bash
convert logo-with-bg.png -resize 180x180 -strip public/apple-touch-icon.png
```

---

## 🚀 Formats Modernes (Next.js Image)

### Configuration Next.js Image

```typescript
// next.config.ts
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 jours
  },
}
```

### Utilisation dans Composants

```tsx
import Image from 'next/image'

// Exemple : Preview d'étiquettes
<Image
  src="/preview-labels.png"
  alt="Aperçu impression étiquettes Avery L7163 - Lalabel"
  width={800}
  height={600}
  quality={85}
  priority={false} // lazy loading par défaut
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..." // placeholder flou
/>
```

### Best Practices Images Produit

```tsx
// Hero Image (Above the fold)
<Image
  src="/hero-screenshot.png"
  alt="Interface Lalabel - Générateur d'étiquettes"
  width={1200}
  height={800}
  priority={true} // ⚡ Charge immédiatement
  quality={90}
/>

// Images Section (Below the fold)
<Image
  src="/feature-formats.png"
  alt="Formats d'étiquettes supportés : Avery, A4, rouleaux"
  width={600}
  height={400}
  loading="lazy" // ⚡ Lazy load
  quality={80}
/>
```

---

## 📏 Attributs Alt Optimisés SEO

### Règles d'Or

✅ **Bon** :
```tsx
<Image
  alt="Étiquettes Avery L7163 imprimées avec adresses Amazon Seller"
  ...
/>
```

❌ **Mauvais** :
```tsx
<Image
  alt="Image" // Trop vague
  ...
/>

<Image
  alt="Photo d'étiquettes" // Éviter "photo de", "image de"
  ...
/>
```

### Formules SEO Efficaces

**Format** : `[Sujet principal] [Action/État] [Contexte] - [Brand]`

**Exemples** :
```tsx
// Preview étiquettes
alt="Étiquettes d'expédition Avery L7163 imprimées depuis Amazon Seller"

// Interface app
alt="Interface Lalabel montrant l'import de fichier CSV Shopify"

// Formats supportés
alt="Comparaison formats d'impression : A4, Avery L7160, rouleaux thermiques"

// Logo
alt="Lalabel - Générateur d'étiquettes d'expédition"
```

---

## 🎯 Optimisation Compression

### Outils Recommandés

#### 1. **Squoosh** (Google) - Interface Web
https://squoosh.app/
- AVIF : Compression -50% vs WebP
- WebP : Compression -30% vs JPEG
- PNG : Compression lossless

#### 2. **ImageMagick** - CLI
```bash
# Installation
brew install imagemagick

# JPEG → WebP
convert image.jpg -quality 85 image.webp

# PNG → AVIF
convert image.png -quality 80 image.avif

# Batch conversion
for img in *.jpg; do convert "$img" -quality 85 "${img%.jpg}.webp"; done
```

#### 3. **Sharp** (Node.js)
```bash
npm install sharp
```

```javascript
// scripts/optimize-images.js
const sharp = require('sharp')

// JPEG → WebP + AVIF
sharp('input.jpg')
  .webp({ quality: 85 })
  .toFile('output.webp')

sharp('input.jpg')
  .avif({ quality: 80 })
  .toFile('output.avif')
```

---

## 📊 Benchmarks Compression

| Format | Qualité | Taille (800KB JPEG) | Gain |
|--------|---------|---------------------|------|
| JPEG   | 100%    | 800KB               | 0%   |
| JPEG   | 85%     | 400KB               | 50%  |
| WebP   | 85%     | 280KB               | 65%  |
| AVIF   | 80%     | 140KB               | 82%  |

**Recommandation** : AVIF + WebP fallback + JPEG

---

## ⚡ Core Web Vitals Impact

### LCP (Largest Contentful Paint)

**Objectif** : <2.5s

**Optimisations** :
```tsx
// Hero image : priority={true}
<Image
  src="/hero.webp"
  priority={true}
  width={1200}
  height={800}
/>

// Preload dans <head>
<link
  rel="preload"
  as="image"
  href="/hero.webp"
  type="image/webp"
/>
```

### CLS (Cumulative Layout Shift)

**Objectif** : <0.1

**Prévention** :
```tsx
// ✅ Toujours spécifier width/height
<Image
  src="/preview.png"
  width={800}   // ← OBLIGATOIRE
  height={600}  // ← OBLIGATOIRE
  alt="..."
/>

// ❌ JAMAIS sans dimensions
<img src="/preview.png" alt="..." />
```

---

## 📱 Responsive Images

### Picture Element avec Fallbacks

```tsx
<picture>
  {/* AVIF - Meilleure compression */}
  <source
    srcSet="/hero-mobile.avif 640w, /hero-tablet.avif 1024w, /hero-desktop.avif 1920w"
    type="image/avif"
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
  />

  {/* WebP - Fallback */}
  <source
    srcSet="/hero-mobile.webp 640w, /hero-tablet.webp 1024w, /hero-desktop.webp 1920w"
    type="image/webp"
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
  />

  {/* JPEG - Ultime fallback */}
  <img
    src="/hero-desktop.jpg"
    alt="Générateur d'étiquettes Lalabel"
    width={1200}
    height={800}
    loading="lazy"
  />
</picture>
```

---

## 🔧 Automation Script

```bash
# scripts/create-seo-images.sh

#!/bin/bash

# Variables
LOGO_SOURCE="assets/logo.svg"
OG_TEMPLATE="assets/og-template.psd"

# 1. Logo PNG
convert $LOGO_SOURCE -resize 512x512 -background none public/logo.png

# 2. PWA Icons
convert public/logo.png -resize 192x192 public/icon-192.png
convert public/logo.png -resize 512x512 public/icon-512.png

# 3. Apple Touch Icon (avec fond)
convert public/logo.png -resize 140x140 \
  -background "#3b82f6" -gravity center -extent 180x180 \
  public/apple-touch-icon.png

# 4. Favicon (multi-size ICO)
convert public/logo.png -resize 32x32 favicon-32.png
convert public/logo.png -resize 16x16 favicon-16.png
convert favicon-32.png favicon-16.png -colors 256 public/favicon.ico
rm favicon-*.png

echo "✅ Images SEO créées avec succès!"
```

---

## ✅ Checklist Finale

### Avant Production

- [ ] og-image.jpg (1200×630, <200KB)
- [ ] logo.png (512×512, <50KB)
- [ ] favicon.ico (32×32 multi-size)
- [ ] icon-192.png + icon-512.png (<80KB total)
- [ ] apple-touch-icon.png (180×180)
- [ ] Tous les attributs `alt` renseignés
- [ ] Next.js Image configuré (AVIF + WebP)
- [ ] Priority sur hero images
- [ ] Lazy loading sur images below-fold
- [ ] Width/height sur toutes les images

### Validation

```bash
# Vérifier poids images
ls -lh public/*.{jpg,png,ico}

# Vérifier formats
file public/og-image.jpg
file public/logo.png

# Test manifest.json
curl http://localhost:3000/manifest.json | jq '.icons'
```

---

## 📚 Ressources

### Outils Gratuits
- [Squoosh](https://squoosh.app/) - Compression images
- [Real Favicon Generator](https://realfavicongenerator.net/) - Favicon multi-device
- [Canva](https://canva.com) - Design og-image
- [TinyPNG](https://tinypng.com/) - Compression PNG/JPG

### Documentation
- [Next.js Image](https://nextjs.org/docs/api-reference/next/image)
- [Web.dev Images](https://web.dev/fast/#optimize-your-images)
- [AVIF Support](https://caniuse.com/avif)

---

**Prêt à optimiser !** 🚀
