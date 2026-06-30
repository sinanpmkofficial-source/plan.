import webpush from 'web-push';

let configured = false;

/**
 * Lazily configure web-push with VAPID details from the environment.
 * Throws only when actually invoked without keys, so the app still builds/runs
 * (e.g. unrelated routes) when push isn't configured yet.
 */
export function getWebPush() {
  if (!configured) {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

    if (!publicKey || !privateKey) {
      throw new Error('Web Push is not configured (missing VAPID keys).');
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
  return webpush;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}
