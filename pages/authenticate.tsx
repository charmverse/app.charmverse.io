import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSpaces } from '../hooks/useSpaces';
import { useWeb3AuthSig } from '../hooks/useWeb3AuthSig';

export default function AuthenticatePage () {

  const { account, walletAuthSignature, sign } = useWeb3AuthSig();
  const router = useRouter();
  const [spaces] = useSpaces();

  useEffect(() => {
    if (account && !walletAuthSignature) {
      sign();
    }
    else if (account && walletAuthSignature) {
      router.push('/join');
    }
  }, [account, walletAuthSignature]);

  return (<h1>Authenticate</h1>);
}
