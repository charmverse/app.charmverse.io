import { ContractDashboard } from 'components/contract/ContractDashboard';
import { aggregateProtocolData } from 'lib/contract/aggregateProtocolData';
import { getContractData } from 'lib/contract/getContractData';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export const dynamic = 'force-dynamic';

export default async function Dashboard({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tab = searchParams.tab as string;
  const seasonOneData = await getContractData();
  return <ContractDashboard seasonOne={seasonOneData} currentTab={tab} />;
}
