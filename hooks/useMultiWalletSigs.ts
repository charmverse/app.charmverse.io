
import charmClient from 'charmClient';
import useSWR from 'swr';

export default function useMultiWalletSigs () {

  return useSWR('/profile/gnosis-safes', () => charmClient.getMyGnosisSafes(), { revalidateOnFocus: false });
}
