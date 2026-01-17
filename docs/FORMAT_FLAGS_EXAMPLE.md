# Format Flags - Guide d'utilisation

## Vue d'ensemble

Le système de feature flags permet d'activer ou désactiver facilement les formats d'impression disponibles dans l'application.

## Configuration

Les flags sont définis dans `/src/lib/print/config.ts` :

```typescript
export const FORMAT_FLAGS: Record<PrintFormat, boolean> = {
  A4: true,                 // Format A4 standard
  A4_COMPACT: true,         // Format A4 compact 2 colonnes
  A4_LABELS_10: true,       // 10 étiquettes par page
  A4_LABELS_14: true,       // 14 étiquettes par page (Avery L7163)
  A4_LABELS_16: true,       // 16 étiquettes par page (Avery L7162)
  A4_LABELS_21: true,       // 21 étiquettes par page (Avery L7160)
  ROLL_57x32: true,         // Rouleaux d'étiquettes 57x32mm
  CSV_EXPORT: true,         // Export CSV
}
```

## Utilisation

### Désactiver un format

Pour masquer un format de l'interface utilisateur, passer son flag à `false` :

```typescript
export const FORMAT_FLAGS: Record<PrintFormat, boolean> = {
  A4: true,
  A4_COMPACT: true,
  A4_LABELS_10: true,
  A4_LABELS_14: false,      // ❌ Format désactivé
  A4_LABELS_16: true,
  A4_LABELS_21: true,
  ROLL_57x32: false,        // ❌ Format désactivé
  CSV_EXPORT: true,
}
```

### Fonctions utilitaires

**Obtenir tous les formats actifs :**
```typescript
import { getEnabledFormats } from '@/lib/print-formats'

const activeFormats = getEnabledFormats()
// Retourne uniquement les formats avec flag=true
```

**Vérifier si un format est actif :**
```typescript
import { isFormatEnabled } from '@/lib/print-formats'

if (isFormatEnabled('A4_LABELS_14')) {
  // Le format est disponible
}
```

## Impact sur l'interface

Lorsqu'un format est désactivé :

1. **Sélecteur de format** : Le format n'apparaît pas dans la liste des options
2. **Validation** : Le format n'est plus considéré comme valide
3. **Persistance** : Si un format sauvegardé est désactivé, l'app revient au format par défaut (A4)

## Exemples d'utilisation

### Désactiver temporairement un format problématique

Si un format a un bug en production :

```typescript
export const FORMAT_FLAGS: Record<PrintFormat, boolean> = {
  // ...
  A4_LABELS_16: false,  // Désactivé temporairement (bug #123)
  // ...
}
```

### Activation progressive de nouveaux formats

Pour tester un nouveau format en interne avant release :

```typescript
export const FORMAT_FLAGS: Record<PrintFormat, boolean> = {
  // ...
  NEW_FORMAT: false,  // En développement, pas encore prêt
  // ...
}
```

### Configuration par environnement (optionnel)

Pour une configuration avancée, on pourrait utiliser des variables d'environnement :

```typescript
export const FORMAT_FLAGS: Record<PrintFormat, boolean> = {
  A4: true,
  A4_COMPACT: true,
  A4_LABELS_10: true,
  A4_LABELS_14: process.env.NEXT_PUBLIC_ENABLE_AVERY_14 === 'true',
  // ...
}
```

## Notes importantes

- Les flags sont en "hard-coded" dans le code source (pas de base de données)
- Un changement de flag nécessite un redéploiement
- Les formats désactivés restent configurés (PRINT_CONFIGS) mais ne sont pas visibles
- Le format par défaut (A4) ne devrait jamais être désactivé
