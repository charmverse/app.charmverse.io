import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import { getChainById } from '@packages/blockchain/connectors/chains';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { http, HttpResponse } from 'msw';
import { mockTokenGateResult, mockTokenGates } from 'stories/lib/mockTokenGataData';

import { TokenGate as TokenGateComponent } from 'components/common/SpaceAccessGate/components/TokenGate/TokenGate';
import { TokenGateModalProvider } from 'components/settings/invites/components/TokenGates/components/TokenGateModal/hooks/useTokenGateModalContext';
import TokenGateModal from 'components/settings/invites/components/TokenGates/components/TokenGateModal/TokenGateModal';
import type { TokenGate } from 'lib/tokenGates/interfaces';
import { TokenGateContainer } from 'pages/join';

export default {
  title: 'common/Token Gate',
  component: TokenGateComponent
};

export function Conditions() {
  return (
    <Paper sx={{ p: 4 }}>
      <TokenGateContainer>
        <Card sx={{ p: 4, mb: 3 }} variant='outlined'>
          <TokenGateComponent tokenGates={mockTokenGates} isVerifying={false} tokenGateResult={mockTokenGateResult} />
        </Card>
      </TokenGateContainer>
    </Paper>
  );
}

export function Modal() {
  return (
    <TokenGateModalProvider
      popupState={{ open: () => {}, isOpen: true, close: () => {} } as PopupState}
      refreshTokenGates={() => {}}
    >
      <TokenGateModal />
    </TokenGateModalProvider>
  );
}

Modal.parameters = {
  msw: {
    handlers: {
      tokenGateVerification: http.post(`/api/token-gates/review`, async ({ request }) => {
        const data = (await request.json()) as TokenGate;

        const accessControlConditions = {
          accessControlConditions: data.conditions.accessControlConditions.map((cond) => ({
            ...cond,
            image: getChainById(cond.chain)?.iconUrl
          }))
        };

        const dataWithMeta = {
          conditions: { accessControlConditions }
        };
        return HttpResponse.json([dataWithMeta]);
      }),
      tokenGateCreation: http.post(`/api/token-gates`, () => {
        return HttpResponse.json({});
      })
    }
  }
};
