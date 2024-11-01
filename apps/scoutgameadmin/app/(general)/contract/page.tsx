import { ContractHome } from 'components/contract/ContractsHome';
import { aggregateProtocolData } from 'lib/contract/aggregateProtocolData';
import { getContractData } from 'lib/contract/getContractData';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const seasonOneData = await getContractData();
  const protocolData = await aggregateProtocolData();
  return <ContractHome seasonOne={seasonOneData} protocol={protocolData} />;
}
