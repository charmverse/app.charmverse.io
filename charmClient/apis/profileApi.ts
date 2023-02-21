import type { ProfileItem } from '@prisma/client';

import * as http from 'adapters/http';
import type { UserCommunity } from 'lib/profile';
import type { SetForumCategoryNotificationInput } from 'lib/userNotifications/setForumCategoryNotification';
import type { ClientUserSpaceNotifications } from 'lib/userNotifications/spaceNotifications';
import type { UserAvatar } from 'lib/users/interfaces';
import type { LoggedInUser } from 'models';

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

  getOrgs(userId: string) {
    return http.GET<UserCommunity[]>(`/api/profile/orgs/${userId}`);
  }

  getSpaceNotifications(input: { spaceId: string }) {
    return http.GET<ClientUserSpaceNotifications>('/api/profile/space-notifications', input);
  }

  setForumCategoryNotification(input: Omit<SetForumCategoryNotificationInput, 'userId'>) {
    return http.PUT('/api/profile/space-notifications/set-forum-category', input);
  }
}
