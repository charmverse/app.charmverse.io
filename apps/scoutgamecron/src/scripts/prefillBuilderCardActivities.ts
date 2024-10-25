import { DateTime } from 'luxon';
import { updateBuilderCardActivity } from '../tasks/updateBuilderCardActivity/updateBuilderCardActivity';

export async function prefillBuilderCardActivities() {
  const currentDate = DateTime.now();
  for (let i = 1; i <= 7; i++) {
    const date = currentDate.minus({ days: i });
    await updateBuilderCardActivity(date);
  }
}

prefillBuilderCardActivities();