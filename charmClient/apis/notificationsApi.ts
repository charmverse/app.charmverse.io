import * as http from 'adapters/http';
import type { Notification } from 'lib/notifications/interfaces';
import type { MarkNotifications } from 'pages/api/notifications/mark';

export class NotificationsApi {
  getNotifications(): Promise<Notification[]> {
    return http.GET('/api/notifications/list');
  }

  markNotifications(payload: MarkNotifications) {
    return http.POST('/api/notifications/mark', payload);
  }
}
