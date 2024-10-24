import { ContractDashboard } from 'components/contract/ContractDashboard';
import { getContractData } from 'lib/contract/getContractData';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const data = await getContractData();
  return <ContractDashboard {...data} />;
}
