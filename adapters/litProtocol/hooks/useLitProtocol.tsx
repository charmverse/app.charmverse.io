import { log } from '@charmverse/core/log';
import * as LitJsSdk from '@lit-protocol/lit-node-client';
import { useEffect, useMemo, useState } from 'react';

function useLitProtocol() {
  const [litClient, setClient] = useState<LitJsSdk.LitNodeClient | null>(null);
  const client = useMemo(
    () =>
      new LitJsSdk.LitNodeClient({
        alertWhenUnauthorized: false,
        debug: false
      }),
    []
  );

  useEffect(() => {
    client
      .connect()
      .then(() => {
        setClient(client);
      })
      .catch((err) => {
        log.debug('Error connecting to Lit node', err);
      });
  }, []);

  return litClient;
}

export default useLitProtocol;
