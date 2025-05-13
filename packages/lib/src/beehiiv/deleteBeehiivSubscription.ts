import type { BeehiivSubscription } from './client';
import { isEnabled, findSubscriptions, deleteSubscription } from './client';

export async function deleteBeehiivSubscription({ email }: BeehiivSubscription) {
  if (!isEnabled) {
    return;
  }
  const { data } = await findSubscriptions({ email });
  if (data.length > 0) {
    return deleteSubscription(data[0]);
  }
}
