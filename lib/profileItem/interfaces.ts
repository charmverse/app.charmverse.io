import { ProfileItem } from '@prisma/client';

export interface UpdateProfileItemRequest {
  shownProfileItems: Pick<ProfileItem, 'id' | 'metadata' | 'type' | 'walletAddress'>[];
  hiddenProfileItems: UpdateProfileItemRequest['shownProfileItems'];
}
