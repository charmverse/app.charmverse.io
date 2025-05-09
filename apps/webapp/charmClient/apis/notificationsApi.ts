import * as http from '@packages/adapters/http';

import type { Notification } from '@packages/lib/notifications/interfaces';
import type { MarkNotifications } from '@packages/lib/notifications/markNotifications';
import type { GetNotificationsStateResponse, UpdateNotificationsState } from 'pages/api/notifications/state';

export class NotificationsApi {
  getNotifications(): Promise<Notification[]> {
    return http.GET('/api/notifications/list');
  }

  getNotificationsState(): Promise<GetNotificationsStateResponse> {
    return http.GET('/api/notifications/state');
  }

  updateNotificationsState(payload: UpdateNotificationsState) {
    return http.PUT('/api/notifications/state', payload);
  }

  markNotifications(payload: MarkNotifications) {
    return http.POST('/api/notifications/mark', payload);
  }
}
