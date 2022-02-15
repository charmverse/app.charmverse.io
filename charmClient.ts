/* eslint-disable class-methods-use-this */
import * as seedData from 'seedData';
import { Space, User } from 'models';
import * as http from 'adapters/http';
import type { LoginResponse } from 'pages/api/auth/login';

const SESSION_TOKEN = 'charm.sessionId';

//
// CharmClient is the client interface to the server APIs
//
class CharmClient {

  getProfile () {

  }

  async login (address: string) {
    const user = await http.POST<LoginResponse>('/api/auth/login', {
      address
    });
    return user;
  }

  async logout () {
    await http.POST<LoginResponse>('/api/auth/logout');
  }

}

const charmClient = new CharmClient();

export default charmClient;
