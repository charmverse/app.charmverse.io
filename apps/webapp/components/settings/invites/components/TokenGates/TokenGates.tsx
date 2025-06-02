import type { Space } from '@charmverse/core/prisma';
import type { PopupState } from 'material-ui-popup-state/hooks';

import { useGetTokenGates } from 'charmClient/hooks/tokenGates';
import { TokenGateModalProvider } from 'components/settings/invites/components/TokenGates/components/TokenGateModal/hooks/useTokenGateModalContext';
import TokenGateModal from 'components/settings/invites/components/TokenGates/components/TokenGateModal/TokenGateModal';

import TokenGatesTable from './components/TokenGatesTable';

interface TokenGatesProps {
  popupState: PopupState;
  isAdmin: boolean;
  space: Space;
}

export function TokenGates({ isAdmin, space, popupState }: TokenGatesProps) {
  const spaceId = space.id;
  const { data = [], mutate, isLoading } = useGetTokenGates(spaceId);

  return (
    <>
      <TokenGatesTable
        isAdmin={isAdmin}
        // Remove token gates that have archived roles
        tokenGates={data.filter((tokenGate) => !tokenGate.tokenGateToRoles.some((role) => role.role.archived))}
        isLoading={isLoading}
        refreshTokenGates={async () => {
          await mutate();
        }}
      />
      <TokenGateModalProvider popupState={popupState} refreshTokenGates={() => mutate()}>
        <TokenGateModal />
      </TokenGateModalProvider>
    </>
  );
}
