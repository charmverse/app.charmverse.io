import env from '@beam-australia/react-env';
import { POST, GET, DELETE, PUT } from '@root/adapters/http';

export class HttpClient {
  readonly baseUrl: string;

  constructor() {
    const connectApiHost = env('CONNECT_API_HOST');
    if (!connectApiHost) {
      throw new Error('REACT_APP_CONNECT_API_HOST is not defined');
    }
    this.baseUrl = connectApiHost;
  }

  async GET<T>(...args: Parameters<typeof GET>): Promise<T> {
    args[0] = this.baseUrl + args[0];
    return GET(...args);
  }

  async POST<T>(...args: Parameters<typeof POST>): Promise<T> {
    args[0] = this.baseUrl + args[0];
    // eslint-disable-next-line no-console
    console.log('POST', this.baseUrl, args);
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
