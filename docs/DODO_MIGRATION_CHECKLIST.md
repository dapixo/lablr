# 🚀 CHECKLIST MIGRATION DODO PAYMENTS

**Date** : 2025-12-31
**Version** : V4.0
**Statut** : ✅ Review de sécurité complétée, prêt pour tests

---

## 📊 RÉSUMÉ DES CORRECTIONS DE SÉCURITÉ

### 🔴 CRITIQUES (COMPLÉTÉES)

| # | Problème | Impact | Statut | Fichier |
|---|----------|--------|--------|---------|
| 1 | Header webhook signature incorrect | ❌ Webhooks rejetés | ✅ CORRIGÉ | `webhook/route.ts:62` |
| 2 | Vérification timestamp manquante | 🛡️ Vulnérabilité replay attacks | ✅ CORRIGÉ | `webhook/route.ts:81-89` |
| 3 | Idempotence non implémentée | 💸 Risque doublons billing | ✅ CORRIGÉ | `webhook/route.ts:91-101` |
| 4 | Prix incorrect dans config | 💰 Incohérence tarifaire | ✅ CORRIGÉ | `config.ts:34,43` |

### 🟠 IMPORTANTS (COMPLÉTÉS)

| # | Problème | Impact | Statut | Fichier |
|---|----------|--------|--------|---------|
| 5 | Rate limiting checkout manquant | 🚨 Abus possible | ✅ CORRIGÉ | `checkout/route.ts:23-27` |
| 6 | Protection CSRF manquante | 🛡️ Vulnérabilité CSRF | ✅ CORRIGÉ | `checkout/route.ts:29-37` |
| 7 | Subscription DB records incomplets | 📊 Perte audit trail | ✅ CORRIGÉ | `webhook/route.ts:170-307` |

### 🟡 OPTIMISATIONS (COMPLÉTÉES)

| # | Problème | Impact | Statut | Fichier |
|---|----------|--------|--------|---------|
| 8 | Types legacy (`status_formatted`) | 🧹 Code propre | ✅ CORRIGÉ | `dodopayments.ts:20` |
| 9 | Statuts manquants (`past_due`, `unpaid`) | 📝 Complétude | ✅ CORRIGÉ | `dodopayments.ts:5-14` |
| 10 | Champ `webhook_id` manquant en DB | 💾 Schema incomplet | ✅ CORRIGÉ | `04-dodo-webhook-idempotency.sql` |

---

## 🔧 DÉTAILS DES CORRECTIONS

### 1. **Webhook Signature Header** ✅

**Problème** : Utilisation de `x-signature` ou `dodo-signature` au lieu du header officiel Dodo.

**Correction** :
```typescript
// ❌ AVANT
const signature = headersList.get('x-signature') || headersList.get('dodo-signature')

// ✅ APRÈS
const signature = headersList.get('webhook-signature')
```

**Impact** : Sans cette correction, TOUS les webhooks étaient rejetés.

---

### 2. **Vérification Timestamp (Replay Attacks)** ✅

**Problème** : Aucune vérification du timestamp, permettant de rejouer d'anciens webhooks.

**Correction** :
```typescript
// Récupération du header
const webhookTimestamp = headersList.get('webhook-timestamp')

// Validation (max 5 minutes)
const timestamp = Number.parseInt(webhookTimestamp, 10)
const now = Math.floor(Date.now() / 1000)
const FIVE_MINUTES = 5 * 60

if (Number.isNaN(timestamp) || Math.abs(now - timestamp) > FIVE_MINUTES) {
  return NextResponse.json({ error: 'Invalid timestamp' }, { status: 401 })
}
```

**Impact** : Protection contre replay attacks (rejeu de webhooks expirés).

---

### 3. **Idempotence Webhook** ✅

**Problème** : Même événement pouvait être traité plusieurs fois.

**Correction** :
```typescript
// Vérifier si déjà traité via webhook_id
const { data: existingEvent } = await supabase
  .from('webhook_events')
  .select('id, processed')
  .eq('webhook_id', webhookId)
  .maybeSingle()

if (existingEvent) {
  return NextResponse.json({ success: true, message: 'Already processed' }, { status: 200 })
}
```

**Impact** : Prévention doublons de billing et traitements multiples.

---

### 4. **Configuration Prix** ✅

**Problème** : Prix mensuel listé à €5 au lieu de €6, savings à 20% au lieu de 33%.

**Correction** :
```typescript
// config.ts
monthly: { price: 6 }  // €6/mois (était 5)
yearly: { price: 48, savings: "33% d'économie" }  // (était 20%)
```

**Impact** : Cohérence tarifaire avec l'UI (UpgradeModal, PricingPage).

---

### 5. **Rate Limiting Checkout** ✅

**Problème** : Pas de rate limiting sur l'endpoint de création de checkout.

**Correction** :
```typescript
// Ajout au début de POST handler
const rateLimitResult = await checkRateLimit(request, 'checkout')
if (!rateLimitResult.success) {
  return rateLimitResult.response
}

// Configuration rate-limit.ts
checkout: {
  maxRequests: 10,
  windowMs: 60 * 1000, // 10 req/minute
}
```

**Impact** : Protection contre spam de sessions checkout (DOS, abus).

---

### 6. **Protection CSRF** ✅

**Problème** : Pas de vérification du referer, vulnérabilité CSRF.

**Correction** :
```typescript
// Domaines autorisés
const ALLOWED_ORIGINS = [
  'https://lalabel.app',
  'https://www.lalabel.app',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
]

// Vérification referer
const referer = request.headers.get('referer')
const isValidReferer = !referer || ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed))

if (!isValidReferer) {
  return NextResponse.json({ error: 'Invalid referer' }, { status: 403 })
}
```

**Impact** : Protection contre attaques CSRF sur endpoint sensible.

---

### 7. **Subscription DB Records** ✅

**Problème** : Table `subscriptions` jamais remplie, seulement logs console.

**Correction** : Implémentation complète pour tous les événements :

- ✅ `subscription.active` : Création record avec status 'active'
- ✅ `subscription.failed` : Update avec période de grâce 7 jours
- ✅ `subscription.on_hold` : Update avec période de grâce
- ✅ `subscription.cancelled` : Update avec `ends_at`
- ✅ `subscription.expired` : Update status 'expired'
- ✅ `subscription.renewed` : Update `renews_at` + clear grace period
- ✅ `subscription.plan_changed` : Update `product_id`
- ✅ `subscription.updated` : Update générique

**Impact** : Audit trail complet, données subscription persistées en DB.

---

### 8-9. **Types TypeScript Cleanup** ✅

**Problème** : Champ legacy `status_formatted`, statuts manquants.

**Correction** :
```typescript
// Retrait de status_formatted (Lemon Squeezy legacy)
// Ajout statuts manquants
export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'past_due'    // ✅ AJOUTÉ
  | 'unpaid'      // ✅ AJOUTÉ
  | 'on_hold'
  | 'cancelled'
  | 'paused'      // ✅ AJOUTÉ
  | 'failed'
  | 'expired'
```

**Impact** : Types cohérents avec Dodo Payments et SQL schema.

---

### 10. **Migration DB Webhook ID** ✅

**Problème** : Champ `webhook_id` utilisé dans le code mais absent du schema DB.

**Correction** : Migration SQL créée
```sql
-- 04-dodo-webhook-idempotency.sql
ALTER TABLE webhook_events
ADD COLUMN webhook_id TEXT UNIQUE;

CREATE INDEX idx_webhook_events_webhook_id ON webhook_events(webhook_id);
```

**Impact** : Support complet de l'idempotence en production.

---

## 📋 ÉTAPES DE DÉPLOIEMENT EN PRODUCTION

### Prérequis

- [ ] Compte Dodo Payments créé (mode live)
- [ ] API Key production récupérée
- [ ] Webhook secret production récupéré
- [ ] Produits créés dans Dodo dashboard (monthly + yearly)
- [ ] Product IDs récupérés

### 1. Configuration des Variables d'Environnement

Ajouter dans Vercel/hosting :

```bash
# Dodo Payments Production
DODO_PAYMENTS_API_KEY=dodo_live_xxxxxxxxxxxxxxxxxxxxx
DODO_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
DODO_BRAND_ID=bnd_xxxxxxxxxxxxxxxxxxxxx
DODO_PRODUCT_MONTHLY=pdt_xxxxxxxxxxxxxxxxxxxxx
DODO_PRODUCT_YEARLY=pdt_xxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANT** : Vérifier que la clé commence par `dodo_live_` (pas `dodo_test_`).

### 2. Migrations Base de Données

Exécuter dans l'ordre via Supabase Dashboard :

```bash
# 1. Migration Dodo (si pas déjà fait)
psql> \i docs/sql/03-dodo-migration-simple.sql

# 2. Migration webhook idempotency (NOUVEAU)
psql> \i docs/sql/04-dodo-webhook-idempotency.sql
```

Vérifier la structure :
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'webhook_events';

-- Doit inclure : webhook_id (TEXT, NULLABLE avec UNIQUE constraint)
```

### 3. Configuration Webhook Dodo Dashboard

1. Se connecter au dashboard Dodo Payments
2. Aller dans **Settings → Webhooks**
3. Créer un nouveau webhook endpoint :
   - URL : `https://lalabel.app/api/dodopayments/webhook`
   - Secret : Copier le secret généré dans `DODO_WEBHOOK_SECRET`
   - Events à écouter :
     ```
     ✓ subscription.active
     ✓ subscription.failed
     ✓ subscription.on_hold
     ✓ subscription.cancelled
     ✓ subscription.expired
     ✓ subscription.renewed
     ✓ subscription.plan_changed
     ✓ subscription.updated
     ```

### 4. Tests de Validation

**Tests webhook** :
```bash
# Test avec Dodo CLI ou dashboard
curl -X POST https://lalabel.app/api/dodopayments/webhook \
  -H "Content-Type: application/json" \
  -H "webhook-signature: xxx" \
  -H "webhook-id: evt_test_123" \
  -H "webhook-timestamp: $(date +%s)" \
  -d '{"event_name":"subscription.active","data":{...}}'
```

Vérifier :
- [ ] Signature validée correctement
- [ ] Timestamp validé (rejet si > 5 min)
- [ ] Idempotence (même webhook_id rejeté 2x)
- [ ] Record créé dans `subscriptions` table
- [ ] Record créé dans `webhook_events` table
- [ ] Profile user mis à jour vers Premium

**Tests checkout** :
- [ ] Créer session checkout (mode test)
- [ ] Vérifier rate limiting (max 10 req/min)
- [ ] Vérifier CSRF protection (referer invalide bloqué)
- [ ] Vérifier redirection vers Dodo checkout

### 5. Monitoring Post-Déploiement

**24 premières heures** :
- [ ] Surveiller logs webhooks : `[Dodo Webhook]`
- [ ] Vérifier aucune erreur de signature
- [ ] Vérifier aucun replay attack détecté
- [ ] Vérifier table `subscriptions` se remplit correctement
- [ ] Vérifier rate limiting fonctionne (X-RateLimit headers)

**Métriques à surveiller** :
```sql
-- Webhooks traités avec succès
SELECT COUNT(*) FROM webhook_events WHERE processed = true;

-- Webhooks avec erreurs
SELECT event_name, processing_error, COUNT(*)
FROM webhook_events
WHERE processing_error IS NOT NULL
GROUP BY event_name, processing_error;

-- Subscriptions actives
SELECT COUNT(*) FROM subscriptions WHERE status = 'active';

-- Users premium
SELECT COUNT(*) FROM profiles WHERE plan = 'premium';
```

---

## 🎯 NEXT STEPS

### Phase 3 : Tests Complets ⏳

**Tests fonctionnels** :
- [ ] Flow complet signup → checkout → webhook → premium
- [ ] Test paiement échoué → période de grâce
- [ ] Test cancellation → accès jusqu'à fin période
- [ ] Test renouvellement → mise à jour dates
- [ ] Test changement de plan monthly ↔ yearly

**Tests sécurité** :
- [ ] Replay attack (timestamp expiré)
- [ ] Signature invalide
- [ ] CSRF attack (referer invalide)
- [ ] Rate limiting (spam checkout)
- [ ] Idempotence (webhook dupliqué)

**Tests edge cases** :
- [ ] User sans email
- [ ] Metadata manquante
- [ ] Product ID inconnu
- [ ] Network timeout
- [ ] DB erreur

### Phase 4 : Déploiement Production ⏳

**Préparation** :
- [ ] Backup DB complet
- [ ] Feature flag pour rollback rapide
- [ ] Documentation complète
- [ ] Support client informé

**Déploiement** :
- [ ] Migration DB production
- [ ] Variables env production
- [ ] Build & deploy Vercel
- [ ] Configuration webhook Dodo
- [ ] Tests smoke production

**Post-déploiement** :
- [ ] Monitoring 24h/24 (1ère semaine)
- [ ] Support actif premium users
- [ ] Analytics checkout conversion
- [ ] Optimisations performance

---

## 📚 DOCUMENTATION TECHNIQUE

### Fichiers Modifiés

**Core Logic** :
- `/src/app/api/dodopayments/webhook/route.ts` (223 → 320 lignes)
- `/src/app/api/dodopayments/checkout/route.ts` (118 → 144 lignes)
- `/src/lib/dodopayments/config.ts` (48 lignes)
- `/src/types/dodopayments.ts` (93 lignes)
- `/src/lib/rate-limit.ts` (212 → 219 lignes)

**Migrations** :
- `/docs/sql/03-dodo-migration-simple.sql` (existant)
- `/docs/sql/04-dodo-webhook-idempotency.sql` (nouveau)

**Documentation** :
- `/CLAUDE.md` (V4.0)
- `/docs/DODO_MIGRATION_CHECKLIST.md` (ce fichier)

### Références Externes

- [Dodo Payments Documentation](https://docs.dodopayments.com)
- [Webhook Security Guide](https://docs.dodopayments.com/developer-resources/webhooks)
- [Twitter Confirmation Signature Header](https://x.com/dodopayments/status/1904521858403475936)

---

## ✅ VALIDATION FINALE

**Toutes les corrections de sécurité sont complétées** :

- ✅ 4 problèmes **CRITIQUES** corrigés
- ✅ 3 problèmes **IMPORTANTS** corrigés
- ✅ 3 **OPTIMISATIONS** appliquées

**Le système est prêt pour Phase 3 (Tests)** 🚀

---

**Dernière mise à jour** : 2025-12-31
**Révisé par** : Claude Code V4.0
**Statut** : ✅ Review complétée, prêt pour tests
