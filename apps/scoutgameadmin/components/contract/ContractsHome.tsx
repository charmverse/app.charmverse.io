'use client';

import { Tabs, Tab, Box } from '@mui/material';
import { useState } from 'react';

import { WagmiProvider } from 'components/providers/wagmi/WagmiProvider';
import type { ProtocolData } from 'lib/contract/aggregateProtocolData';
import type { BuilderNFTContractData } from 'lib/contract/getContractData';

import { ProtocolContractDashboard } from './ProtocolContractDashboard';
import { SeasonOneDashboard } from './SeasonOneDashboard';

export function ContractHome({ seasonOne, protocol }: { seasonOne: BuilderNFTContractData; protocol: ProtocolData }) {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleChange = (e: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  return (
    <Box px={6}>
      <Tabs value={selectedTab} onChange={handleChange}>
        <Tab label='Season One' />
        <Tab label='Protocol (Testnet)' />
      </Tabs>
      <Box mt={2}>
        {selectedTab === 0 && <SeasonOneDashboard {...seasonOne} />}
        {selectedTab === 1 && (
          <WagmiProvider>
            <ProtocolContractDashboard {...protocol} />
          </WagmiProvider>
        )}
      </Box>
    </Box>
  );
}
