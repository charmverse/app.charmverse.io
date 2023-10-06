import * as http from 'adapters/http';
import type { Notification } from 'lib/notifications/interfaces';
import type { MarkNotifications } from 'lib/notifications/markNotifications';
import type { GetTasksStateResponse, UpdateTasksState } from 'pages/api/notifications/state';

export class NotificationsApi {
  getNotifications(): Promise<Notification[]> {
    return http.GET('/api/notifications/list');
  }

  getNotificationsState(): Promise<GetTasksStateResponse> {
    return http.GET('/api/notifications/state');
  }

  updateNotificationsState(payload: UpdateTasksState) {
    return http.PUT('/api/notifications/state', payload);
  }

  markNotifications(payload: MarkNotifications) {
    return http.POST('/api/notifications/mark', payload);
  }
}
