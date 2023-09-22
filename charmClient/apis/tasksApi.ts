import * as http from 'adapters/http';
import type { MarkNotification } from 'lib/userNotifications/markNotifications';
import type { GetTasksResponse } from 'pages/api/tasks/list';
import type { GetTasksStateResponse, UpdateTasksState } from 'pages/api/tasks/state';

export class TasksApi {
  getTasksList(): Promise<GetTasksResponse> {
    return http.GET('/api/tasks/list');
  }

  getTasksState(): Promise<GetTasksStateResponse> {
    return http.GET('/api/tasks/state');
  }

  updateTasksState(payload: UpdateTasksState) {
    return http.PUT('/api/tasks/state', payload);
  }

  markNotifications(tasks: MarkNotification[]) {
    return http.POST('/api/tasks/mark', tasks);
  }
}
