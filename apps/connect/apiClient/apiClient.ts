'use client';

import { ImageApiClient } from './imageApiClient';
import { TestApiClient } from './testApiClient';

class ConnectApiClient {
  test = new TestApiClient();

  image = new ImageApiClient();
}

export const connectApiClient = new ConnectApiClient();
