
import * as http from 'adapters/http';
import type { GnosisSafeTasks } from 'lib/gnosis/gnosis.tasks';
import type { GetTasksResponse } from 'pages/api/tasks/list';

export class TasksApi {
  getTasksList (): Promise<GetTasksResponse> {
    return http.GET('/api/tasks/list');
  }

  getGnosisTasks (): Promise<GnosisSafeTasks[]> {
    return http.GET('/api/tasks/gnosis');
  }
}
