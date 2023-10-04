import * as http from 'adapters/http';
import type { Notification } from 'lib/notifications/interfaces';

export class NotificationsApi {
  getNotifications(): Promise<Notification[]> {
    return http.GET('/api/notifications/list');
  }

  markNotifications(notificationIds: string[]) {
    return http.POST('/api/notifications/mark', notificationIds);
  }
}
