'use client';

import { Tabs, Tab, Box } from '@mui/material';
import { useState } from 'react';

import type { BuilderNFTContractData } from 'lib/contract/getContractData';

import { ProtocolContractDashboard } from './ProtocolContractDashboard';
import { SeasonOneDashboard } from './SeasonOneDashboard';

export function ContractHome({ seasonOne }: { seasonOne: BuilderNFTContractData }) {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
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
        {selectedTab === 1 && <ProtocolContractDashboard {...seasonOne} />}
      </Box>
    </Box>
  );
}
