import * as http from 'adapters/http';
import type { Notification } from 'lib/notifications/interfaces';
import type { MarkTask } from 'lib/userNotifications/markTasks';
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

  markNotifications(tasks: MarkTask[]) {
    return http.POST('/api/notifications/mark', tasks);
  }
}
