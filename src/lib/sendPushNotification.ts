// src/lib/sendPushNotification.ts
export async function sendPushNotification({
  userId,
  title,
  body,
  url,
}: {
  userId: string;
  title: string;
  body: string;
  url?: string;
}) {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, body, url }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Push notification failed:', data.error);
    }
    return data;
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}