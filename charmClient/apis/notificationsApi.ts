import * as http from 'adapters/http';
import type { MarkNotification } from 'lib/notifications/markNotifications';
import type { GetNotificationsResponse } from 'pages/api/notifications/list';
import type { GetNotificationsStateResponse, UpdateTasksState } from 'pages/api/notifications/state';

export class NotificationsApi {
  getNotifications(): Promise<GetNotificationsResponse> {
    return http.GET('/api/notifications/list');
  }

  getNotificationsState(): Promise<GetNotificationsStateResponse> {
    return http.GET('/api/notifications/state');
  }

  updateNotificationsState(payload: UpdateTasksState) {
    return http.PUT('/api/notifications/state', payload);
  }

  markNotifications(tasks: MarkNotification[]) {
    return http.POST('/api/notifications/mark', tasks);
  }
}
