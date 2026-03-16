/**
 * pushNotify.js — Server-side Web Push helper
 *
 * Vereiste omgevingsvariabelen (.env.local):
 *   VAPID_PUBLIC_KEY=<gegenereerd via: npx web-push generate-vapid-keys>
 *   VAPID_PRIVATE_KEY=<gegenereerd via: npx web-push generate-vapid-keys>
 *   VAPID_MAILTO=mailto:jouw@email.nl
 *
 * Genereer VAPID-sleutels eenmalig:
 *   npx web-push generate-vapid-keys
 * Kopieer de output naar je .env.local
 */
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

var supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

var vapidConfigured = !!(
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_MAILTO
);

if (vapidConfigured) {
    webpush.setVapidDetails(
        process.env.VAPID_MAILTO,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

/**
 * Stuur een push-notificatie naar alle opgeslagen subscriptions.
 * @param {object} payload - { title, body, icon?, url?, tag? }
 */
export async function sendPushToAll(payload) {
    if (!vapidConfigured) {
        console.warn('[pushNotify] VAPID-sleutels niet geconfigureerd — notificaties overgeslagen');
        return { sent: 0, errors: 0 };
    }

    var { data: subscriptions } = await supabase.from('push_subscriptions').select('*');
    if (!subscriptions || subscriptions.length === 0) return { sent: 0, errors: 0 };

    var message = JSON.stringify({
        title: payload.title || 'BBQ Architect',
        body: payload.body || '',
        icon: payload.icon || '/logo.png',
        badge: '/logo.png',
        url: payload.url || '/',
        tag: payload.tag || 'bbq-architect',
    });

    var sent = 0;
    var errors = 0;
    var staleEndpoints = [];

    await Promise.allSettled(
        subscriptions.map(async function (sub) {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    message,
                    { TTL: 86400 } // 24u geldig
                );
                sent++;
            } catch (err) {
                errors++;
                // 410 = subscription verlopen, verwijder uit DB
                if (err.statusCode === 410 || err.statusCode === 404) {
                    staleEndpoints.push(sub.endpoint);
                }
            }
        })
    );

    // Verwijder verlopen subscriptions
    if (staleEndpoints.length > 0) {
        await supabase.from('push_subscriptions').delete().in('endpoint', staleEndpoints);
    }

    return { sent, errors };
}
