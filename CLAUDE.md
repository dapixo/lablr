# LABLR - Générateur d'Étiquettes pour Amazon Seller

## Vue d'ensemble

**Lablr** est un micro SaaS permettant aux vendeurs Amazon de générer et imprimer facilement des étiquettes d'adresse à partir de leurs rapports Amazon Seller au format TSV.

## Architecture Technique

### Stack
- **Framework** : Next.js 15.5.2 (App Router)
- **Language** : TypeScript
- **Styling** : Tailwind CSS
- **Build Tool** : Turbopack
- **UI Components** : Components UI personnalisés (Button, Card, etc.)

### Structure du Projet
```
src/
├── app/
│   ├── globals.css        # Styles globaux
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Page d'accueil
├── components/
│   ├── ui/                # Composants UI réutilisables
│   ├── file-upload.tsx    # Upload de fichier TSV
│   ├── address-list.tsx   # Liste des adresses
│   ├── address-editor.tsx # Éditeur d'adresses
│   ├── address-summary.tsx # Résumé des adresses
│   ├── print-preview.tsx  # Aperçu et impression
│   └── sticky-print-panel.tsx # Panel d'impression flottant
├── lib/
│   ├── utils.ts           # Utilitaires (cn, etc.)
│   ├── address-parser.ts  # Parser pour fichiers TSV Amazon
│   └── print-formats.ts   # Formats d'impression
└── types/
    └── address.ts         # Types TypeScript
```

## Fonctionnalités Principales

### 1. Import de Données Amazon Seller
- Upload de fichiers TSV (rapports Amazon Seller)
- Validation et parsing automatique des adresses
- Gestion des erreurs de format

### 2. Gestion des Adresses
- Affichage et édition des adresses importées
- Validation des champs requis
- Prévisualisation des adresses

### 3. Formats d'Impression Supportés
- **A4** : Format standard (une adresse par ligne)
- **A4_LABELS_10** : 10 étiquettes autocollantes 105×57mm par page
- **ROLL_57x32** : Rouleaux d'étiquettes 57×32mm (une par adresse)

## Commandes de Développement

```bash
# Démarrer le serveur de développement
npm run dev

# Build de production
npm run build

# Lancer la production
npm start

# Linting (si configuré)
npm run lint

# Type checking (si configuré)  
npm run type-check
```

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
type PrintFormat = 'A4' | 'A4_LABELS_10' | 'ROLL_57x32'
```

## Formats d'Impression Détaillés

### Format A4 Standard
- Marge : 20mm
- Police : 12px
- Une adresse par ligne avec bordures

### Format A4 Étiquettes (105×57mm)
- 10 étiquettes par page (grille 2×5)
- Espacement optimisé pour étiquettes autocollantes
- Centrage du contenu

### Format Rouleau (57×32mm)
- Étiquettes individuelles 57mm × 32mm
- Saut de page automatique après chaque étiquette
- Police adaptée (9px) pour le petit format
- Marges minimales (2mm)

## Points d'Attention

### Sécurité
- Validation stricte des fichiers (TSV uniquement, max 10MB)
- Pas de stockage de données côté serveur
- Traitement local des données

### Performance
- Utilisation de Turbopack pour un démarrage rapide
- Composants optimisés avec React hooks
- Rendu conditionnel pour grandes listes

### UX
- Interface drag & drop pour l'upload
- Aperçu temps réel des étiquettes
- Responsive design adaptatif

## Évolutions Possibles

- Support d'autres formats de fichiers (CSV, Excel)
- Templates personnalisables
- Sauvegarde locale des configurations
- Export PDF/PNG des étiquettes
- Support d'autres tailles d'étiquettes