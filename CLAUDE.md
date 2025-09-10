# LABLR - Générateur d'Étiquettes pour Amazon Seller

## Vue d'ensemble

**Lablr** est une solution professionnelle permettant aux vendeurs Amazon de générer et imprimer facilement des étiquettes d'adresse à partir de leurs rapports Amazon Seller au format TSV. Interface moderne et intuitive avec design responsive pour tous les appareils.

## Architecture Technique

### Stack
- **Framework** : Next.js 15.5.2 (App Router) avec Turbopack
- **Language** : TypeScript 5.x
- **Styling** : Tailwind CSS + PrimeReact
- **UI Components** : PrimeReact v10.9.7 (Lara Light Blue theme)
- **Icons** : PrimeIcons + Lucide React
- **Build Tool** : Turbopack pour développement rapide

### Structure du Projet
```
src/
├── app/
│   ├── globals.css        # Styles globaux Tailwind
│   ├── layout.tsx         # Layout avec PrimeReact Provider
│   └── page.tsx           # Page principale avec header/footer professionnels
├── components/
│   ├── file-upload.tsx    # Upload drag & drop avec PrimeReact
│   ├── address-list.tsx   # Liste avec pagination (15 par page) et recherche
│   ├── address-editor.tsx # Éditeur modal avec PrimeReact Dialog
│   └── print-preview.tsx  # Aperçu et impression
├── lib/
│   ├── utils.ts           # Utilitaires (cn)
│   ├── address-parser.ts  # Parser robuste pour fichiers TSV Amazon
│   └── print-formats.ts   # Formats d'impression optimisés
└── types/
    └── address.ts         # Types TypeScript stricts
```

## Fonctionnalités Principales

### 1. Interface Professionnelle
- Header moderne avec logo et navigation
- Welcome section avec processus 3 étapes
- Footer informatif avec fonctionnalités et avantages
- Design responsive mobile-first
- Transitions et animations fluides

### 2. Import de Données Amazon Seller
- Upload drag & drop intuitif avec PrimeReact
- Validation stricte des fichiers (TSV, max 10MB)
- Parsing automatique et robuste des adresses
- Gestion d'erreurs détaillée avec feedback utilisateur
- Auto-scroll vers les options d'impression après upload

### 3. Gestion Avancée des Adresses
- **Liste paginée** : 15 adresses par page avec navigation
- **Recherche en temps réel** : Par nom, adresse, ville, pays
- **Édition en modal** : Interface PrimeReact Dialog
- **Ajout manuel** : Possibilité d'ajouter des adresses
- **Suppression** : Avec confirmation
- **Responsive** : Layouts différents mobile/desktop

### 4. Optimisations Performance
- **React.memo** : Composants mémorisés pour éviter re-renders
- **useCallback** : Callbacks optimisés
- **useMemo** : Calculs coûteux mis en cache (filtrage + pagination)
- **Pagination** : Limite l'affichage pour grandes listes
- **Debounced search** : Recherche optimisée

### 5. Formats d'Impression Supportés
- **A4** : Format standard (une adresse par ligne)
- **A4_COMPACT** : Format compact 2 colonnes, économise le papier
- **A4_LABELS_10** : 10 étiquettes autocollantes 105×57mm par page
- **A4_LABELS_21** : 21 étiquettes Avery 70×42.3mm par page (format L7160)
- **ROLL_57x32** : Rouleaux d'étiquettes 57×32mm (une par adresse)
- **CSV_EXPORT** : Export des données au format CSV pour tableur

## Commandes de Développement

```bash
# Démarrer le serveur de développement (avec Turbopack)
pnpm dev

# Build de production
pnpm build

# Lancer la production
pnpm start

# Installer les dépendances
pnpm install

# Linting (ESLint)
pnpm run lint

# Type checking
pnpm run type-check
```

## Technologies et Dépendances

### Dépendances Principales
```json
{
  "next": "15.5.2",
  "react": "19.1.0", 
  "typescript": "5.x",
  "primereact": "10.9.7",
  "primeicons": "7.0.0",
  "tailwindcss": "latest",
  "lucide-react": "latest"
}
```

### Configuration Tailwind
- Pas de mode sombre (simplifié)
- Fonts personnalisées : Geist Sans & Mono
- Classes utilitaires optimisées

## Types Principaux

### Address
```typescript
interface Address {
  id: string
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2?: string
  postalCode: string
  city: string
  country: string
}
```

### PrintFormat
```typescript
type PrintFormat = 
  | 'A4' 
  | 'A4_LABELS_10' 
  | 'ROLL_57x32'
  | 'A4_LABELS_21'
  | 'A4_COMPACT'
  | 'CSV_EXPORT'
```

## Formats d'Impression Détaillés

### Format A4 Standard
- Marge : 20mm
- Police : 12px
- Une adresse par ligne avec bordures
- Optimisé pour impression bureautique

### Format A4 Compact (2 colonnes)
- Marge : 15mm
- Police : 10px
- Disposition en 2 colonnes avec float CSS
- Économise le papier, idéal pour les listes importantes

### Format A4 Étiquettes 10 (105×57mm)
- 10 étiquettes par page (grille 2×5)
- Espacement optimisé pour étiquettes autocollantes
- Centrage du contenu
- Compatible étiquettes autocollantes standards

### Format A4 Étiquettes Avery 21 (70×42.3mm)
- 21 étiquettes par page (grille 3×7)
- Format Avery L7160 standard
- Positionnement précis avec inline-flex
- Texte centré verticalement et horizontalement

### Format Rouleau (57×32mm)
- Étiquettes individuelles 57mm × 32mm
- Saut de page automatique après chaque étiquette
- Police adaptée (9px) pour le petit format
- Marges minimales (2mm)
- Compatible imprimantes thermiques

### Format CSV Export
- Export au format CSV avec encodage UTF-8
- Headers : Prénom, Nom, Adresse 1, Adresse 2, Code Postal, Ville, Pays
- Compatible avec Excel, Google Sheets, etc.
- Téléchargement automatique via blob

## Fonctionnalités UX Avancées

### Auto-scroll Intelligent
- Scroll automatique vers les options d'impression après upload
- PAS de scroll automatique lors de la suppression d'adresses
- Compensation de la hauteur du header sticky (80px)
- Animation smooth pour meilleure expérience

### Interface de Sélection des Formats
- **Design en cartes** : Interface moderne avec cartes cliquables
- **Groupement logique** : Tous les formats A4 groupés ensemble
- **Iconographie** : Emojis distinctifs pour chaque format
- **Feedback visuel** : États sélectionné/non-sélectionné clairement marqués
- **Animations** : Transitions fluides et hover effects

### Accessibilité Améliorée
- **Structure sémantique** : `<fieldset>`, `<legend>`, `<label>` appropriés
- **Navigation clavier** : Support complet des radio buttons natifs
- **Lecteurs d'écran** : ARIA labels et descriptions
- **Focus management** : Indicateurs visuels de focus
- **Standards WCAG** : Conformité aux bonnes pratiques d'accessibilité

### Responsive Design
- **Mobile-first** : Interface optimisée mobile
- **Breakpoints** : sm, md, lg adaptés
- **Navigation** : Layouts différents selon la taille d'écran
- **Typography** : Tailles adaptatives

### States Management
- **Loading states** : Indicateurs de chargement
- **Error handling** : Messages d'erreur contextuels
- **Empty states** : Messages informatifs quand pas de données
- **Success feedback** : Confirmations d'actions

## Architecture des Composants

### Composants Mémorisés
```typescript
// Composants optimisés avec React.memo
const AddressCard = React.memo(function AddressCard({...}))
const SearchBar = React.memo(function SearchBar({...}))
const EmptySearchState = React.memo(function EmptySearchState())
const FormatCard = React.memo(function FormatCard({...}))
```

### Hooks Personnalisés
- **Callbacks mémorisés** : `useCallback` pour éviter re-renders
- **Computed values** : `useMemo` pour calculs coûteux
- **Event handlers** : Optimisés avec dependencies

## Points d'Attention

### Sécurité
- Validation stricte des fichiers (TSV uniquement, max 10MB)
- Pas de stockage de données côté serveur
- Traitement local des données (sécurité privacy-first)
- Sanitisation des inputs utilisateur

### Performance
- **Turbopack** : Démarrage ultra-rapide en développement
- **Pagination** : Limite à 15 adresses par page
- **React optimizations** : memo, useCallback, useMemo
- **Lazy loading** : Chargement conditionnel des composants

### UX/UI
- **PrimeReact integration** : Composants professionnels cohérents
- **Drag & drop** : Interface intuitive pour l'upload
- **Responsive** : Expérience optimale tous appareils
- **Accessibility** : ARIA labels, navigation clavier

### Maintenance
- **TypeScript strict** : Typage fort pour éviter les erreurs
- **Code splitting** : Architecture modulaire
- **Clean code** : Fonctions pures, séparation des responsabilités

## Évolutions Futures

### Fonctionnalités
- Support CSV et Excel en plus du TSV
- Templates d'étiquettes personnalisables  
- Export PDF/PNG pour archivage
- Sauvegarde locale des configurations utilisateur
- Support formats d'étiquettes additionnels

### Techniques
- PWA (Progressive Web App) pour usage offline
- Tests automatisés (Jest + Testing Library)
- CI/CD avec GitHub Actions
- Monitoring et analytics
- Optimisations SEO