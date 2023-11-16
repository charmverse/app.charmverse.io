import { Card, Paper } from '@mui/material';
import { mockTokenGateResult, mockTokenGates } from 'stories/lib/mockTokenGataData';

import { TokenGate } from 'components/common/SpaceAccessGate/components/TokenGate/TokenGate';
import UserDescription from 'components/settings/profile/components/UserDescription';
import { TokenGateContainer } from 'pages/join';

export default {
  title: 'common/Token Gate',
  component: UserDescription
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
