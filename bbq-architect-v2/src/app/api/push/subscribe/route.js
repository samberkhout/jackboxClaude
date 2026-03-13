import { createClient } from '@supabase/supabase-js';

var supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * POST /api/push/subscribe
 * Body: { subscription: PushSubscription, userAgent?: string }
 *
 * Sla een Web Push-abonnement op in Supabase.
 * Wordt aangeroepen vanuit de browser na toestemming.
 */
export async function POST(request) {
    try {
        var body = await request.json();
        var sub = body.subscription;

        if (!sub || !sub.endpoint || !sub.keys) {
            return Response.json({ error: 'Ongeldige subscription' }, { status: 400 });
        }

        var { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                endpoint: sub.endpoint,
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
                user_agent: body.userAgent || '',
            }, { onConflict: 'endpoint' });

        if (error) throw error;

        return Response.json({ success: true });
    } catch (err) {
        console.error('[push/subscribe]', err);
        return Response.json({ error: err.message }, { status: 500 });
    }
}

/**
 * DELETE /api/push/subscribe
 * Body: { endpoint: string }
 *
 * Verwijder een push-abonnement (uitschrijven).
 */
export async function DELETE(request) {
    try {
        var body = await request.json();
        if (!body.endpoint) return Response.json({ error: 'endpoint verplicht' }, { status: 400 });

        await supabase.from('push_subscriptions').delete().eq('endpoint', body.endpoint);
        return Response.json({ success: true });
    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}
