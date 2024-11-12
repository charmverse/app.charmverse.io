import { ContractHome } from 'components/contract/ContractsHome';
import { aggregateProtocolData } from 'lib/contract/aggregateProtocolData';
import { getContractData } from 'lib/contract/getContractData';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const user = await getUserFromSession();
  const seasonOneData = await getContractData();
  const protocolData = await aggregateProtocolData({ userId: user?.id });
  return <ContractHome seasonOne={seasonOneData} protocol={protocolData} />;
}
