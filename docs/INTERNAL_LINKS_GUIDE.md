# 🔗 Guide Optimisation Liens Internes - Lalabel

**Date** : 2026-01-06
**Objectif** : Maillage interne SEO optimal

---

## 📊 Stratégie de Maillage Interne

### Principe SEO
- **PageRank Flow** : Transférer l'autorité entre pages
- **Anchor text optimisé** : Mots-clés naturels descriptifs
- **Profondeur < 3 clics** : Toute page accessible en 3 clics max
- **Cohérence thématique** : Lier pages avec contenu similaire

---

## 🎯 Liens Internes Prioritaires Implémentés

### 1. Header (Global)
✅ **Navigation principale** :
```tsx
// src/components/Header.tsx (lignes à ajouter si manquantes)
<Link href={`/${locale}`}>Accueil</Link>
<Link href={`/${locale}/pricing`}>Tarifs</Link>
<Link href={`/${locale}#faq`}>FAQ</Link>
<Link href={`/${locale}/account`}>Mon Compte</Link>
```

### 2. Footer (Global)
✅ **Liens existants optimisés** :
```tsx
// src/components/Footer.tsx
<Link href={`/${locale}`}>Générateur d'étiquettes</Link>
<Link href={`/${locale}/pricing`}>Plans et tarifs</Link>
<Link href={`/${locale}#faq`}>Questions fréquentes</Link>
<Link href="mailto:contact@lalabel.app">Contact</Link>
```

### 3. Page 404
✅ **Déjà implémenté** dans `/src/app/not-found.tsx` :
- Lien vers page d'accueil
- Lien vers /pricing
- Lien vers #faq
- Lien vers /login

### 4. FAQ Section
**À améliorer** : Ajouter liens contextuels dans réponses

---

## 📝 Liens Internes à Ajouter dans FAQ

### Question "pricing" (Tarifs)
**Texte actuel** :
```
"notre plan Premium à partir de 4€/mois"
```

**Optimisé avec lien** :
```tsx
// Modifier src/components/FAQ.tsx pour supporter HTML
<p>
  Lalabel vous offre jusqu'à 5 étiquettes gratuitement.
  Si vous avez besoin de plus, notre{' '}
  <Link
    href="/fr/pricing"
    className="text-blue-600 hover:text-blue-800 underline font-medium"
  >
    plan Premium à partir de 4€/mois
  </Link>
  {' '}vous donne accès à des étiquettes illimitées.
</p>
```

### Question "formats" (Formats supportés)
**Lien à ajouter** :
```tsx
<p>
  Lalabel supporte tous les formats d'étiquettes populaires.
  <Link href="/fr#formats-section">Voir la liste complète</Link>
</p>
```

### Question "platforms" (Plateformes)
**Lien à ajouter** :
```tsx
<p>
  Compatible avec Amazon Seller, Shopify, eBay...
  <Link href="/fr#upload">Essayez maintenant</Link>
</p>
```

---

## 🏗️ Implémentation Component FAQ avec Liens

### Option 1 : Markdown dans Traductions (Recommandé)

```typescript
// src/lib/markdown-to-html.ts (existe déjà)
import { markdownToHtml } from '@/lib/i18n-helpers'

// messages/fr.json
{
  "faq": {
    "questions": {
      "pricing": {
        "answer": "Lalabel offre 10 étiquettes gratuites par jour. Pour plus, notre [plan Premium](/fr/pricing) à 6€/mois offre des étiquettes illimitées."
      }
    }
  }
}

// src/components/FAQ.tsx
<div dangerouslySetInnerHTML={{
  __html: markdownToHtml(t(`faq.questions.${faqId}.answer`))
}} />
```

### Option 2 : Composant Rich Text

```tsx
// src/components/FAQ/FAQAnswer.tsx
interface FAQAnswerProps {
  text: string
  locale: string
}

export function FAQAnswer({ text, locale }: FAQAnswerProps) {
  // Parse [lien](url) et remplace par <Link>
  const parseLinks = (text: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = linkRegex.exec(text)) !== null) {
      // Texte avant le lien
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }

      // Le lien
      parts.push(
        <Link
          key={match.index}
          href={match[2]}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {match[1]}
        </Link>
      )

      lastIndex = match.index + match[0].length
    }

    // Texte après le dernier lien
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts.length > 0 ? parts : text
  }

  return <p>{parseLinks(text)}</p>
}
```

---

## 🎨 Liens Contextuels par Section

### Hero Section
**Anchor text** : "Essayer gratuitement"
**Target** : `#file-upload-section` (scroll smooth)
```tsx
<a
  href="#file-upload-section"
  onClick={(e) => {
    e.preventDefault()
    document.getElementById('file-upload-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }}
>
  Essayer gratuitement
</a>
```

### Features Section
**À ajouter** :
```tsx
<section id="features" className="py-16">
  <h2>Tous les formats d'étiquettes supportés</h2>

  <div className="formats-grid">
    <div className="format-card">
      <h3>Étiquettes Avery</h3>
      <p>
        Compatible L7160, L7162, L7163.
        <Link href="/fr/pricing">Passer en Premium</Link>
        pour un accès illimité.
      </p>
    </div>

    <div className="format-card">
      <h3>Format A4 Standard</h3>
      <p>
        Imprimez sur papier A4 classique.
        <Link href="/fr#faq">Voir comment faire</Link>
      </p>
    </div>
  </div>
</section>
```

### Pricing CTA
**Dans page principale** :
```tsx
<div className="cta-premium">
  <h2>Besoin de plus d'étiquettes ?</h2>
  <p>
    Passez au plan Premium pour des étiquettes illimitées.
    <Link href="/fr/pricing">Voir les tarifs</Link>
  </p>
</div>
```

---

## 📍 Anchor Links Optimisés

### Structure Recommandée

```tsx
// Page principale avec sections ID
<main>
  <section id="hero">...</section>
  <section id="how-it-works">...</section>
  <section id="features">...</section>
  <section id="formats">...</section>
  <section id="faq">...</section>
</main>

// Liens dans menu/footer
<Link href="/fr#features">Fonctionnalités</Link>
<Link href="/fr#formats">Formats</Link>
<Link href="/fr#faq">FAQ</Link>
```

---

## 🔗 Exemples Anchor Text SEO

### ❌ Mauvais
```tsx
<Link href="/pricing">Cliquez ici</Link>
<Link href="/pricing">En savoir plus</Link>
<Link href="/pricing">Voir</Link>
```

### ✅ Bon
```tsx
<Link href="/pricing">Plan Premium illimité</Link>
<Link href="/pricing">Tarifs étiquettes illimitées</Link>
<Link href="/pricing">Abonnement Premium 6€/mois</Link>
```

### Règles
1. **Descriptif** : Indiquer la destination
2. **Mots-clés** : Inclure termes SEO naturellement
3. **Longueur** : 2-5 mots idéal
4. **Éviter** : "cliquez ici", "en savoir plus", URLs brutes

---

## 🎯 Liens Internes par Type de Page

### Page Principale (/)
**Liens sortants** :
- → `/pricing` (dans hero, features, footer)
- → `/#faq` (dans header, footer, CTA)
- → `/account` (dans header si connecté)
- → `/login` (dans header si non connecté)

### Page Pricing (/pricing)
**Liens sortants** :
- → `/` (retour accueil, breadcrumb)
- → `/#faq` (questions sur tarifs)
- → `/account` (après upgrade)
- → `/#formats` (voir formats supportés)

### Page Account (/account)
**Liens sortants** :
- → `/` (retour accueil)
- → `/pricing` (upgrade vers premium)
- → `/#faq` (aide)

### Page Login (/login)
**Liens sortants** :
- → `/` (retour accueil)
- → `/#faq` (aide connexion)

---

## 📊 Métriques à Suivre

### Google Search Console
- **Taux de clics internes** : % utilisateurs qui cliquent
- **Profondeur moyenne** : Nombre moyen de clics vers pages
- **Pages orphelines** : Pages sans liens entrants

### Google Analytics
- **Flow de navigation** : Parcours utilisateur
- **Pages de sortie** : Où les users quittent
- **Taux de rebond par page** : Optimiser liens sur pages high bounce

---

## ✅ Checklist Liens Internes

### Structure Globale
- [ ] Header : Navigation claire (Accueil, Tarifs, FAQ, Compte)
- [ ] Footer : Liens répétés + Contact
- [ ] Breadcrumbs : Sur toutes les pages sauf home
- [ ] 404 : Liens de secours vers pages principales

### Contenu
- [ ] FAQ : Liens vers /pricing dans réponse tarifs
- [ ] Features : Liens vers /pricing dans chaque feature premium
- [ ] Hero : CTA vers #upload ou /pricing
- [ ] Pricing : Retour vers /#formats

### Technique
- [ ] Tous liens `<Link>` Next.js (pas `<a>`)
- [ ] Anchor text descriptif (pas "cliquez ici")
- [ ] Attribut `title` sur liens ambigus
- [ ] Smooth scroll pour anchor links (#faq, #features)

---

## 🚀 Quick Wins Immédiats

### 1. Ajouter dans messages/fr.json
```json
{
  "faq": {
    "questions": {
      "pricing": {
        "answer": "Lalabel offre 10 étiquettes gratuites/jour. Pour plus, consultez notre [plan Premium](/fr/pricing) à 6€/mois pour étiquettes illimitées."
      },
      "formats": {
        "answer": "Tous formats supportés : Avery L7160-L7163, A4, rouleaux thermiques. [Essayez maintenant](/fr#upload) !"
      }
    }
  }
}
```

### 2. Modifier FAQ.tsx pour supporter Markdown
```tsx
// src/components/FAQ.tsx
import { markdownToHtml } from '@/lib/i18n-helpers'

<div
  className="text-gray-600 leading-relaxed p-4"
  dangerouslySetInnerHTML={{
    __html: markdownToHtml(t(`faq.questions.${faqId}.answer`))
  }}
/>
```

### 3. Ajouter ID sections manquantes
```tsx
// src/app/[locale]/page.tsx
<section id="features" className="py-16">...</section>
<section id="formats" className="py-12">...</section>
<section id="upload" className="py-8">...</section>
```

---

## 📚 Ressources

- [Google: Internal Linking Best Practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Moz: Internal Link Building Guide](https://moz.com/learn/seo/internal-link)
- [Ahrefs: Internal Links Study](https://ahrefs.com/blog/internal-links-for-seo/)

---

**Liens internes = SEO juice !** 🚀
