'use client';

import { TestApiClient } from './testApiClient';

class ConnectApiClient {
  test = new TestApiClient();
}

export const connectApiClient = new ConnectApiClient();
