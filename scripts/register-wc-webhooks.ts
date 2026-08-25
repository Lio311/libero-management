/**
 * One-time script to register WooCommerce webhooks for all stores.
 * 
 * Usage:
 *   npx tsx scripts/register-wc-webhooks.ts
 * 
 * This will register order.created, order.updated, and order.deleted
 * webhooks on each WooCommerce store (libero, velour, labura).
 * 
 * Prerequisites:
 *   - Set WC_WEBHOOK_SECRET in your .env file
 *   - Ensure all WC API keys have read/write permissions
 */

import 'dotenv/config';

const DELIVERY_BASE = 'https://libero-management.vercel.app/api/webhooks/woocommerce';

const STORES = {
  libero: {
    ck: process.env.LIBERO_WC_CK || '',
    cs: process.env.LIBERO_WC_CS || '',
    baseUrl: 'https://libero-il.co.il',
  },
  velour: {
    ck: process.env.VELOUR_WC_CK || '',
    cs: process.env.VELOUR_WC_CS || '',
    baseUrl: 'https://velour.co.il',
  },
  labura: {
    ck: process.env.LABURA_WC_CK || '',
    cs: process.env.LABURA_WC_CS || '',
    baseUrl: 'https://la-burro.co.il',
  },
} as const;

const TOPICS = ['order.created', 'order.updated', 'order.deleted'] as const;

async function listExistingWebhooks(store: keyof typeof STORES) {
  const config = STORES[store];
  const auth = Buffer.from(`${config.ck}:${config.cs}`).toString('base64');

  const res = await fetch(`${config.baseUrl}/wp-json/wc/v3/webhooks?per_page=100`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    console.error(`  ❌ Failed to list webhooks for ${store}: ${res.status}`);
    return [];
  }

  return res.json();
}

async function deleteWebhook(store: keyof typeof STORES, webhookId: number) {
  const config = STORES[store];
  const auth = Buffer.from(`${config.ck}:${config.cs}`).toString('base64');

  const res = await fetch(`${config.baseUrl}/wp-json/wc/v3/webhooks/${webhookId}?force=true`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  return res.ok;
}

async function registerWebhook(store: keyof typeof STORES, topic: string) {
  const config = STORES[store];
  const auth = Buffer.from(`${config.ck}:${config.cs}`).toString('base64');
  const secret = process.env.WC_WEBHOOK_SECRET || 'default-webhook-secret';

  const deliveryUrl = `${DELIVERY_BASE}?store=${store}`;

  const payload = {
    name: `Libero Management - ${topic} (${store})`,
    topic,
    delivery_url: deliveryUrl,
    secret,
    status: 'active',
  };

  const res = await fetch(`${config.baseUrl}/wp-json/wc/v3/webhooks`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`  ❌ Failed to register ${topic} for ${store}: ${res.status} - ${errorText}`);
    return false;
  }

  const data = await res.json();
  console.log(`  ✅ Registered ${topic} for ${store} (webhook ID: ${data.id})`);
  return true;
}

async function main() {
  console.log('🔄 WooCommerce Webhook Registration\n');

  if (!process.env.WC_WEBHOOK_SECRET) {
    console.error('❌ WC_WEBHOOK_SECRET is not set in .env. Please set it first.');
    console.log('   You can generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
  }

  for (const store of Object.keys(STORES) as (keyof typeof STORES)[]) {
    const config = STORES[store];
    if (!config.ck || !config.cs) {
      console.log(`⏭️  Skipping ${store} — no API keys configured`);
      continue;
    }

    console.log(`\n📦 Processing store: ${store} (${config.baseUrl})`);

    // 1. List existing webhooks and clean up old ones from our app
    const existing = await listExistingWebhooks(store);
    const ourWebhooks = existing.filter((wh: any) =>
      wh.delivery_url?.includes('libero-management') ||
      wh.name?.includes('Libero Management')
    );

    if (ourWebhooks.length > 0) {
      console.log(`  🧹 Cleaning up ${ourWebhooks.length} existing webhook(s)...`);
      for (const wh of ourWebhooks) {
        const deleted = await deleteWebhook(store, wh.id);
        console.log(`    ${deleted ? '✅' : '❌'} Deleted webhook ${wh.id} (${wh.topic})`);
      }
    }

    // 2. Register new webhooks
    for (const topic of TOPICS) {
      await registerWebhook(store, topic);
    }
  }

  console.log('\n✅ Done! Webhooks are now registered.');
  console.log(`   Delivery URL: ${DELIVERY_BASE}?store=<store>`);
  console.log(`   Secret: ${process.env.WC_WEBHOOK_SECRET?.substring(0, 8)}...`);
}

main().catch(console.error);
