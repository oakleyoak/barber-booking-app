import { supabaseUrl } from '../lib/supabase';

export const NotificationsService = {
  sendNotification: async (payload: any) => {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('NotificationsService send failed', text);
        return { ok: false, status: res.status, body: text };
      }
      const json = await res.json();
      return { ok: true, status: res.status, body: json };
    } catch (err) {
      console.error('NotificationsService error', err);
      return { ok: false, error: (err as Error).message };
    }
  }
};
