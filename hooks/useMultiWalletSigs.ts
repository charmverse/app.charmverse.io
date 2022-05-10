
import useSWR from 'swr';
import charmClient from 'charmClient';

export default function useMultiWalletSigs () {

  return useSWR('/profile/multi-sigs', () => charmClient.listUserMultiSigs(), { revalidateOnFocus: false });
}
