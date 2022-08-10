import * as http from 'adapters/http';
import { SetAvatarRequest } from 'lib/users/interfaces';
import { LoggedInUser } from 'models';

export class ProfileApi {
  setAvatar (data: SetAvatarRequest) {
    return http.PUT<LoggedInUser>('/api/profile/avatar', data);
  }
}

