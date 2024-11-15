'use server';

import { aggregateProtocolData } from 'lib/contract/aggregateProtocolData';
import { getUserFromSession } from 'lib/session/getUserFromSession';

import { ProtocolContractView } from './ProtocolContractView';

export async function ProtocolContract() {
  const user = await getUserFromSession();
  const protocolData = await aggregateProtocolData({ userId: user?.id });

  return <ProtocolContractView {...protocolData} />;
}
