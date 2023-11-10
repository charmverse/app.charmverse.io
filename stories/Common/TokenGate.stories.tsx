import type { AccsDefaultParams } from '@lit-protocol/types';
import { Card, Paper } from '@mui/material';

import { TokenGate } from 'components/common/SpaceAccessGate/components/TokenGate/TokenGate';
import UserDescription from 'components/settings/profile/components/UserDescription';
import type { TokenGateEvaluationResult } from 'lib/tokenGates/evaluateEligibility';
import type { TokenGateWithRoles } from 'lib/tokenGates/interfaces';
import { TokenGateContainer } from 'pages/join';
import { createMockTokenGate } from 'testing/mocks/tokenGate';

import { spaces as _spaces, spaceRoles } from '../lib/mockData';

export default {
  title: 'common/Token Gate',
  component: UserDescription
};

export function Conditions() {
  const ownsWalletCondition: AccsDefaultParams = {
    conditionType: 'evmBasic',
    contractAddress: '',
    standardContractType: '',
    chain: 'ethereum',
    method: '',
    parameters: [':userAddress'],
    returnValueTest: {
      comparator: '=',
      value: '0x1Bd0d6eDB387114b2fDf20D683366Fa9F94A07f4'
    }
  };

  const tokenGates: TokenGateWithRoles[] = [
    createMockTokenGate({
      conditions: {
        unifiedAccessControlConditions: [ownsWalletCondition]
      },
      tokenGateToRoles: [
        {
          role: spaceRoles[0]
        }
      ]
    })
  ];
  const tokenGateResult: TokenGateEvaluationResult = {
    space: _spaces[0],
    walletAddress: '0x1234',
    canJoinSpace: true,
    gateTokens: tokenGates.map((tokenGate) => ({
      signedToken: '123',
      tokenGate
    })),
    roles: spaceRoles
  };

  return (
    <Paper sx={{ p: 4 }}>
      <TokenGateContainer>
        <Card sx={{ p: 4, mb: 3 }} variant='outlined'>
          <TokenGate tokenGates={tokenGates} isVerifying={false} tokenGateResult={tokenGateResult} />
        </Card>
      </TokenGateContainer>
    </Paper>
  );
}
