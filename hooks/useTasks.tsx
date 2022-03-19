import { useEffect, useMemo, useState } from 'react';
import charmClient from 'charmClient';
import { Task } from 'models';

export function useTasks () {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const getTasks = async () => {
      const data: Task[] = await charmClient.listTasks();
      setTasks(data);
    };

    getTasks();

    return () => setTasks([]);
  }, []);

  return tasks;
}

