import { logger } from '../config/logger';

export type NotificationChannel = 'email' | 'push' | 'sms';

export interface Notification {
  userId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
}

/**
 * Abstraction over notification delivery. Currently a stub that records intent.
 * Real channels (email/push/SMS) can be registered here later without touching callers.
 */
export interface NotificationDispatcher {
  dispatch(notification: Notification): Promise<void>;
}

class StubNotificationDispatcher implements NotificationDispatcher {
  async dispatch(notification: Notification): Promise<void> {
    logger.info('[notifications] would dispatch', {
      userId: notification.userId,
      channel: notification.channel,
      title: notification.title,
    });
  }
}

export const notificationDispatcher: NotificationDispatcher = new StubNotificationDispatcher();
