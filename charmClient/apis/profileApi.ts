import { ProfileItem } from '@prisma/client';
import * as http from 'adapters/http';
import { UserAvatar } from 'lib/users/interfaces';
import { LoggedInUser } from 'models';

export interface UpdateProfileItemRequest {
  profileItems: Omit<ProfileItem, 'userId'>[];
}

export class ProfileApi {
  setAvatar (data: UserAvatar) {
    return http.PUT<LoggedInUser>('/api/profile/avatar', data);
  }

  updateProfileItem (data: UpdateProfileItemRequest) {
    return http.PUT('/api/profile/items', data);
  }
}

