
import * as http from 'adapters/http';
import type { GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
import type { MarkTask } from 'lib/tasks/markTasks';
import type { GetTasksResponse } from 'pages/api/tasks/list';
import type { GetTasksStateResponse, UpdateTasksState } from 'pages/api/tasks/state';

export class TasksApi {
  getTasksList (): Promise<GetTasksResponse> {
    return http.GET('/api/tasks/list');
  }

  getGnosisTasks (): Promise<GnosisSafeTasks[]> {
    return http.GET('/api/tasks/gnosis');
  }

  getTasksState (): Promise<GetTasksStateResponse> {
    return http.GET('/api/tasks/state');
  }

  updateTasksState (payload: UpdateTasksState) {
    return http.PUT('/api/tasks/state', payload);
  }

  markTasks (tasks: MarkTask[]) {
    return http.POST('/api/tasks/mark', tasks);
  }
}
