import { useMemo, useState, useEffect } from 'react';
import LitJsSdk from 'lit-js-sdk';

function useLitProtocol () {

  const [litClient, setClient] = useState<LitJsSdk.LitNodeClient | null>(null);
  const client = useMemo(() => new LitJsSdk.LitNodeClient({
    alertWhenUnauthorized: false,
    // This option is documented in Lit docs, but not in their typescript definition
    debug: false
  } as any), []);

  useEffect(() => {
    client.connect()
      .then(() => {
        setClient(client);
      });
  }, []);

  return litClient;
}

export default useLitProtocol;
