import { DateTime } from 'luxon';
import { updateBuilderCardActivity } from '../tasks/updateBuilderCardActivity/updateBuilderCardActivity';

export async function prefillBuilderCardActivities() {
  const currentDate = DateTime.utc();
  await updateBuilderCardActivity(currentDate);
}

prefillBuilderCardActivities();