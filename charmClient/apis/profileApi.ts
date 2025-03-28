import type { ProfileItem } from '@charmverse/core/prisma';
import type { LoggedInUser } from '@packages/profile/getUser';
import type { UserCommunity } from '@packages/profile/interfaces';
import type { UserAvatar } from '@packages/users/interfaces';
import * as http from '@root/adapters/http';

import type { SetForumCategoryNotificationInput } from 'lib/userNotifications/setForumCategoryNotification';
import type { ClientUserSpaceNotifications } from 'lib/userNotifications/spaceNotifications';

export interface UpdateProfileItemRequest {
  profileItems: Omit<ProfileItem, 'userId'>[];
}

export class ProfileApi {
  setAvatar(data: UserAvatar) {
    return http.PUT<LoggedInUser>('/api/profile/avatar', data);
  }

  updateProfileItem(data: UpdateProfileItemRequest) {
    return http.PUT('/api/profile/items', data);
  }

  getSpaces(userId: string) {
    return http.GET<UserCommunity[]>(`/api/profile/orgs/${userId}`);
  }

  getSpaceNotifications(input: { spaceId: string }) {
    return http.GET<ClientUserSpaceNotifications>('/api/profile/space-notifications', input);
  }

  setForumCategoryNotification(input: Omit<SetForumCategoryNotificationInput, 'userId'>) {
    return http.PUT('/api/profile/space-notifications/set-forum-category', input);
  }
}
