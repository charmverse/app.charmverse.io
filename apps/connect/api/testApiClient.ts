import { BaseConnectApiClient } from './baseConnectApiClient';

export class TestApiClient extends BaseConnectApiClient {
  async getRandomNumber(): Promise<{ number: number }> {
    return this.GET('/api/random-number');
  }
}
