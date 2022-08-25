import * as http from 'adapters/http';
import { UserAvatar } from 'lib/users/interfaces';
import { LoggedInUser } from 'models';

export class ProfileApi {
  setAvatar (data: UserAvatar) {
    return http.PUT<LoggedInUser>('/api/profile/avatar', data);
  }
}

