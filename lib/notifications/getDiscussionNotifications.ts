import { getCardNotifications } from './getCardNotifications';
import { getDocumentNotifications } from './getDocumentNotifications';
import { sortByDate } from './utils';

export async function getDiscussionNotifications(userId: string) {
  const cardNotifications = await getCardNotifications(userId);
  const documentNotifications = await getDocumentNotifications(userId);

  return {
    marked: [...cardNotifications.marked, ...documentNotifications.marked].sort(sortByDate),
    unmarked: [...cardNotifications.unmarked, ...documentNotifications.unmarked].sort(sortByDate)
  };
}
