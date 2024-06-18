import { POST, GET, DELETE, PUT } from 'adapters/http';
import { connectApiHost } from 'config/constants';

export class BaseConnectApiClient {
  readonly baseUrl: string;

  constructor() {
    this.baseUrl = connectApiHost;
  }

  async GET<T>(...args: Parameters<typeof GET>): Promise<T> {
    args[0] = this.baseUrl + args[0];
    return GET(...args);
  }

  async POST<T>(...args: Parameters<typeof POST>): Promise<T> {
    args[0] = this.baseUrl + args[0];
    return POST(...args);
  }

  async DELETE<T>(...args: Parameters<typeof DELETE>): Promise<T> {
    args[0] = this.baseUrl + args[0];
    return DELETE(...args);
  }

  async PUT<T>(...args: Parameters<typeof PUT>): Promise<T> {
    args[0] = this.baseUrl + args[0];
    return PUT(...args);
  }
}
