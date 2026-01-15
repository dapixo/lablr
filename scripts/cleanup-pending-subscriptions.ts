/**
 * Script de nettoyage des subscriptions pending chez Dodo Payments
 *
 * Usage:
 *   npx tsx scripts/cleanup-pending-subscriptions.ts
 *
 * Ce script :
 * 1. Liste toutes les subscriptions
 * 2. Filtre celles en statut "pending"
 * 3. Les annule une par une
 */

import DodoPayments from 'dodopayments'

async function main() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY

  if (!apiKey) {
    console.error('❌ DODO_PAYMENTS_API_KEY non définie')
    console.log('Exécute avec: DODO_PAYMENTS_API_KEY=xxx npx tsx scripts/cleanup-pending-subscriptions.ts')
    process.exit(1)
  }

  // Détecter automatiquement l'environnement depuis la clé API
  // Les clés test commencent généralement par "dodo_test_" ou similaire
  const isTestKey = apiKey.includes('test') || apiKey.startsWith('sk_test')
  const forceTestMode = process.env.DODO_TEST_MODE === 'true'
  const isTestMode = isTestKey || forceTestMode

  console.log('🔑 Configuration:')
  console.log(`   API Key: ${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 4)}`)
  console.log(`   Environment: ${isTestMode ? 'test_mode' : 'live_mode'}`)
  console.log('')

  const client = new DodoPayments({
    bearerToken: apiKey,
    environment: isTestMode ? 'test_mode' : 'live_mode',
  })

  console.log(`🔍 Recherche des subscriptions pending...\n`)

  // Collecter les subscriptions pending
  const pendingSubscriptions: Array<{
    id: string
    product_id: string
    created_at: string
    customer_email?: string
  }> = []

  for await (const subscription of client.subscriptions.list()) {
    if (subscription.status === 'pending') {
      pendingSubscriptions.push({
        id: subscription.subscription_id,
        product_id: subscription.product_id,
        created_at: subscription.created_at,
        customer_email: subscription.customer?.email,
      })
    }
  }

  if (pendingSubscriptions.length === 0) {
    console.log('✅ Aucune subscription pending trouvée. Tout est propre !')
    return
  }

  console.log(`📋 ${pendingSubscriptions.length} subscription(s) pending trouvée(s):\n`)

  for (const sub of pendingSubscriptions) {
    console.log(`  - ${sub.id}`)
    console.log(`    Product: ${sub.product_id}`)
    console.log(`    Email: ${sub.customer_email || 'N/A'}`)
    console.log(`    Créée: ${sub.created_at}`)
    console.log('')
  }

  // Demander confirmation
  console.log('⚠️  Ces subscriptions vont être annulées.')
  console.log('    Appuie sur Ctrl+C pour annuler, ou attends 5 secondes pour continuer...\n')

  await new Promise((resolve) => setTimeout(resolve, 5000))

  // Annuler les subscriptions
  console.log('🗑️  Annulation des subscriptions pending...\n')

  let successCount = 0
  let errorCount = 0

  for (const sub of pendingSubscriptions) {
    try {
      // Utiliser update pour changer le statut ou cancel si disponible
      await client.subscriptions.update(sub.id, {
        status: 'cancelled',
      })
      console.log(`  ✅ ${sub.id} - Annulée`)
      successCount++
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      console.log(`  ❌ ${sub.id} - Erreur: ${message}`)
      errorCount++
    }
  }

  console.log(`\n📊 Résumé:`)
  console.log(`   ✅ Succès: ${successCount}`)
  console.log(`   ❌ Erreurs: ${errorCount}`)
}

main().catch(console.error)
