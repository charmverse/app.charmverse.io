import { ReactNode, createContext, useContext, useMemo, useState, useEffect } from 'react';
import LitJsSdk from 'lit-js-sdk';

const LitProtocolContext = createContext<LitJsSdk.LitNodeClient | null>(null);

export function LitProtocolProvider ({ children }: { children: ReactNode }) {

  const [litClient, setClient] = useState<LitJsSdk.LitNodeClient | null>(null);
  const client = useMemo(() => new LitJsSdk.LitNodeClient({
    alertWhenUnauthorized: false
  }), []);

  useEffect(() => {
    client.connect()
      .then(() => {
        setClient(client);
      });
  }, []);

  return (
    <LitProtocolContext.Provider value={litClient}>
      {children}
    </LitProtocolContext.Provider>
  );
}

const useLitProtocol = () => useContext(LitProtocolContext);

export default useLitProtocol;
