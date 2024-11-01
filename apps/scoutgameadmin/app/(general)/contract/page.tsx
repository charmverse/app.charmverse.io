import { ContractHome } from 'components/contract/ContractsHome';
import { getContractData } from 'lib/contract/getContractData';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const data = await getContractData();
  return <ContractHome seasonOne={data} />;
}
