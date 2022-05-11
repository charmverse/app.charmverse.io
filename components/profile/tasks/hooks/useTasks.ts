
import useSWR from 'swr';
import charmClient from 'charmClient';

// function isMultiSigTransaction (transaction: GnosisTransaction): transaction is SafeMultisigTransactionWithTransfersResponse {
//   return transaction.txType === 'MULTISIG_TRANSACTION';
// }

export default function useTasks () {

  const { data: tasks, error: serverError } = useSWR('/tasks', () => charmClient.getTasks());
  const error = serverError?.message || serverError;

  return { tasks, error };
}
