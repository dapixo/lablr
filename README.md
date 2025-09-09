# 🏷️ Lablr - Générateur d'Étiquettes Amazon Seller

**Lablr** est un micro SaaS qui permet aux vendeurs Amazon de générer et imprimer facilement des étiquettes d'adresse à partir de leurs rapports Amazon Seller.

## ✨ Fonctionnalités

- 📁 **Import simple** : Glissez-déposez vos rapports Amazon Seller (.txt au format TSV)
- ✏️ **Édition d'adresses** : Corrigez et validez vos adresses avant impression
- 🖨️ **Formats d'impression multiples** :
  - **A4 Standard** : Format classique, une adresse par ligne
  - **A4 Étiquettes** : 10 étiquettes autocollantes 105×57mm par page
  - **Rouleau 57×32mm** : Étiquettes rouleau, une par adresse
- 👁️ **Aperçu temps réel** : Visualisez le rendu avant impression
- 🔒 **Sécurité** : Traitement local, aucune donnée stockée sur nos serveurs

## 🚀 Installation et Développement

### Prérequis
- Node.js 18+ 
- npm, yarn, pnpm ou bun

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd lablr

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### Scripts Disponibles

```bash
npm run dev      # Serveur de développement (Turbopack)
npm run build    # Build de production
npm start        # Serveur de production
npm run lint     # Vérification du code
```

## 📖 Utilisation

1. **Importez** votre rapport Amazon Seller (fichier .txt au format TSV)
2. **Vérifiez** et éditez les adresses importées si nécessaire
3. **Choisissez** votre format d'impression préféré
4. **Prévisualisez** le rendu avec l'aperçu intégré
5. **Imprimez** directement depuis votre navigateur

### Formats de Fichier Supportés

Le système accepte les rapports Amazon Seller au format TSV avec les colonnes suivantes :
- `buyer-name` : Nom complet du destinataire
- `ship-address-1` : Première ligne d'adresse
- `ship-address-2` : Seconde ligne d'adresse (optionnelle)
- `ship-postal-code` : Code postal
- `ship-city` : Ville
- `ship-country` : Pays

## 🏗️ Architecture

### Stack Technique
- **Frontend** : Next.js 15.5.2 (App Router)
- **Styling** : Tailwind CSS
- **Language** : TypeScript
- **Build** : Turbopack pour des performances optimales
- **UI** : Composants personnalisés avec Lucide Icons

### Structure du Projet
```
src/
├── app/           # Pages Next.js (App Router)
├── components/    # Composants React réutilisables
├── lib/          # Utilitaires et logique métier
└── types/        # Définitions TypeScript
```

## 🎯 Formats d'Impression

### A4 Standard
- Format classique pour impression bureau
- Une adresse par entrée avec séparateurs
- Parfait pour archivage et référence

### A4 Étiquettes (105×57mm)
- Compatible étiquettes autocollantes standard
- 10 étiquettes par page en grille 2×5
- Optimisé pour les envois e-commerce

### Rouleau 57×32mm
- Format compact pour étiquettes rouleau
- Une étiquette par adresse
- Idéal pour imprimantes d'étiquettes thermiques

## 🔧 Configuration et Personnalisation

Le projet utilise plusieurs fichiers de configuration :
- `tailwind.config.ts` : Configuration Tailwind CSS
- `next.config.ts` : Configuration Next.js
- `biome.json` : Configuration du linter/formatter

## 📱 Responsive Design

L'interface s'adapte automatiquement aux différentes tailles d'écran :
- 📱 **Mobile** : Interface optimisée tactile
- 💻 **Desktop** : Workflow complet avec aperçu
- 🖥️ **Large screens** : Utilisation maximale de l'espace

## 🚀 Déploiement

### Vercel (Recommandé)
Le déploiement sur [Vercel](https://vercel.com) est automatique :

1. Connectez votre repository GitHub
2. Vercel détecte automatiquement Next.js
3. Déployez en un clic

### Autres Plateformes
Compatible avec toutes les plateformes supportant Next.js :
- Netlify
- Railway
- AWS Amplify
- Docker

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation dans `CLAUDE.md`

---

*Développé avec ❤️ pour simplifier la vie des vendeurs Amazon*
