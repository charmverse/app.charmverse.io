import useSWR from 'swr';

import charmClient from 'charmClient';

export default function useMultiWalletSigs() {
  return useSWR('/profile/gnosis-safes', () => charmClient.gnosisSafe.getMyGnosisSafes());
}
