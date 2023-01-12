import LitJsSdk from 'lit-js-sdk';
import { useEffect, useMemo, useState } from 'react';

import log from 'lib/log';

function useLitProtocol() {
  const [litClient, setClient] = useState<LitJsSdk.LitNodeClient | null>(null);
  const client = useMemo(
    () =>
      new LitJsSdk.LitNodeClient({
        alertWhenUnauthorized: false,
        // This option is documented in Lit docs, but not in their typescript definition
        debug: false
      } as any),
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
