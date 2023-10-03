import * as http from 'adapters/http';
import type { MarkTask } from 'lib/userNotifications/markTasks';
import type { GetNotificationsResponse } from 'pages/api/tasks/list';
import type { GetTasksStateResponse, UpdateTasksState } from 'pages/api/tasks/state';

export class TasksApi {
  getTasksList(): Promise<GetNotificationsResponse> {
    return http.GET('/api/tasks/list');
  }

  getTasksState(): Promise<GetTasksStateResponse> {
    return http.GET('/api/tasks/state');
  }

  updateTasksState(payload: UpdateTasksState) {
    return http.PUT('/api/tasks/state', payload);
  }

  markTasks(tasks: MarkTask[]) {
    return http.POST('/api/tasks/mark', tasks);
  }
}
