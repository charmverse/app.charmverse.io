import { Tabs, Tab, Box, Container } from '@mui/material';
import Link from 'next/link';

import { WagmiProvider } from 'components/providers/wagmi/WagmiProvider';
import type { BuilderNFTContractData } from 'lib/contract/getContractData';

import { ProtocolContract } from './ProtocolContract';
import { SeasonOneView } from './SeasonOneView';

export function ContractDashboard({
  seasonOne,
  currentTab = 'seasonOne'
}: {
  seasonOne: BuilderNFTContractData;
  currentTab?: string;
}) {
  return (
    <Container maxWidth='xl'>
      <Tabs value={currentTab}>
        <Tab
          component={Link}
          value='seasonOne'
          label='Season One'
          href={{
            query: { tab: 'seasonOne' }
          }}
        />
        <Tab
          component={Link}
          value='protocol'
          label='Protocol (Testnet)'
          href={{
            query: { tab: 'protocol' }
          }}
        />
      </Tabs>
      <Box mt={2}>
        {currentTab === 'seasonOne' && <SeasonOneView {...seasonOne} />}
        {currentTab === 'protocol' && (
          <WagmiProvider>
            <ProtocolContract />
          </WagmiProvider>
        )}
      </Box>
    </Container>
  );
}
