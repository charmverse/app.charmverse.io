import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import { mockTokenGateResult, mockTokenGates } from 'stories/lib/mockTokenGataData';

import { TokenGate } from 'components/common/SpaceAccessGate/components/TokenGate/TokenGate';
import { TokenGateContainer } from 'pages/join';

export default {
  title: 'tokengate/Token Gate',
  component: TokenGate
};

export function Conditions() {
  return (
    <Paper sx={{ p: 4 }}>
      <TokenGateContainer>
        <Card sx={{ p: 4, mb: 3 }} variant='outlined'>
          <TokenGate tokenGates={mockTokenGates} isVerifying={false} tokenGateResult={mockTokenGateResult} />
        </Card>
      </TokenGateContainer>
    </Paper>
  );
}
