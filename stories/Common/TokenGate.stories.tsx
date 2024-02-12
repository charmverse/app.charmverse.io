import Card from '@mui/material/Card';
import Paper from '@mui/material/Paper';
import { getChainById } from 'connectors/chains';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { rest } from 'msw';
import { mockTokenGateResult, mockTokenGates } from 'stories/lib/mockTokenGataData';

import { TokenGate as TokenGateComponent } from 'components/common/SpaceAccessGate/components/TokenGate/TokenGate';
import { TokenGateModalProvider } from 'components/common/TokenGateModal/hooks/useTokenGateModalContext';
import TokenGateModal from 'components/common/TokenGateModal/TokenGateModal';
import { LIT_CHAINS } from 'lib/tokenGates/chains';
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
      tokenGateVerification: rest.post(`/api/token-gates/review`, async (req, res, ctx) => {
        const data: TokenGate = await req.json();

        const unifiedAccessControlConditions =
          data.type === 'lit'
            ? {
                unifiedAccessControlConditions: data.conditions.unifiedAccessControlConditions?.map((cond) => ({
                  ...cond,
                  ...('chain' in cond && { image: getChainById(LIT_CHAINS[cond.chain].chainId)?.iconUrl })
                }))
              }
            : undefined;
        const lock = data.type === 'unlock' ? data.conditions : undefined;

        const hyper =
          data.type === 'hypersub' ? { ...data.conditions, image: '/images/logos/fabric-xyz.svg' } : undefined;

        const dataWithMeta = {
          type: data.type,
          conditions: unifiedAccessControlConditions || lock || hyper
        };
        return res(ctx.json([dataWithMeta]));
      }),
      tokenGateCreation: rest.post(`/api/token-gates`, async (req, res, ctx) => {
        return res(ctx.json({}));
      })
    }
  }
};
