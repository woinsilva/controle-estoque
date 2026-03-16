export type NotificationPayload = {
  severity: 'success' | 'info' | 'warn' | 'error';
  summary?: string;
  detail: string;
  life?: number;
};

type NotificationListener = (payload: NotificationPayload) => void;

const listeners = new Set<NotificationListener>();

export function notify(payload: NotificationPayload) {
  listeners.forEach((listener) => listener(payload));
}

export function subscribeNotifications(listener: NotificationListener) {
  listeners.add(listener);
}

export function unsubscribeNotifications(listener: NotificationListener) {
  listeners.delete(listener);
}
