import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import ShareModal from 'lit-share-modal';
import { ResourceId, checkAndSignAuthMessage, SigningConditions } from 'lit-js-sdk';
import { usePopupState, bindTrigger } from 'material-ui-popup-state/hooks';
import useLitProtocol from 'adapters/litProtocol/hooks/useLitProtocol';
import { TokenGate } from '@prisma/client';
import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import BackDrop from '@mui/material/Backdrop';
import Portal from '@mui/material/Portal';
import { ErrorModal } from 'components/common/Modal';
import Button from 'components/common/Button';
import { getLitChainFromChainId } from 'lib/token-gates';
import Legend from '../Legend';
import TokenGatesTable from './TokenGatesTable';
import { TokenGatesProvider, useTokenGates } from './hooks/useTokenGates';

// Example: https://github.com/LIT-Protocol/lit-js-sdk/blob/9b956c0f399493ae2d98b20503c5a0825e0b923c/build/manual_tests.html

type ConditionsModalResult = Pick<SigningConditions, 'accessControlConditions' | 'permanant'>;

export function TokenGates ({ isAdmin, spaceId }: { isAdmin: boolean, spaceId: string }) {
  const litClient = useLitProtocol();
  const { chainId } = useWeb3React();
  const { tokenGatesWithRoles, mutate } = useTokenGates();
  const popupState = usePopupState({ variant: 'popover', popupId: 'token-gate' });
  const errorPopupState = usePopupState({ variant: 'popover', popupId: 'token-gate-error' });
  const [apiError, setApiError] = useState<string>('');
  function onSubmit (conditions: ConditionsModalResult) {
    setApiError('');
    saveTokenGate(conditions)
      .then(() => {
        popupState.close();
      })
      .catch(error => {
        setApiError(error.message || error);
        errorPopupState.open();
      });
  }

  async function saveTokenGate (conditions: Partial<SigningConditions>) {
    const tokenGateId = uuid();
    const resourceId: ResourceId = {
      baseUrl: 'https://app.charmverse.io',
      path: `${Math.random()}`,
      orgId: spaceId,
      role: 'member',
      extraData: JSON.stringify({
        tokenGateId
      })
    };
    const chain = getLitChainFromChainId(chainId);

    const authSig = await checkAndSignAuthMessage({
      chain
    });
    await litClient!.saveSigningCondition({
      ...conditions,
      authSig,
      chain,
      resourceId
    });
    await charmClient.saveTokenGate({
      conditions: conditions as any,
      resourceId,
      spaceId,
      id: tokenGateId
    });
    await mutate();
  }

  async function deleteTokenGate (tokenGate: TokenGate) {
    if (window.confirm('Are you sure?')) {
      await charmClient.deleteTokenGate(tokenGate.id);
      // update the list of links
      await mutate();
    }
  }

  return (
    <>
      <Legend>
        Token Gates
        {isAdmin && (
          <Button
            {...bindTrigger(popupState)}
            variant='outlined'
            sx={{ float: 'right' }}
          >
            Add a gate
          </Button>
        )}
      </Legend>
      {Object.keys(tokenGatesWithRoles).length === 0 && <Typography color='secondary'>No token gates yet</Typography>}
      {Object.values(tokenGatesWithRoles).length > 0
        && <TokenGatesTable isAdmin={isAdmin} tokenGates={Object.values(tokenGatesWithRoles)} onDelete={deleteTokenGate} />}
      <Portal>
        <BackDrop
          onClick={popupState.close}
          open={popupState.isOpen}
          sx={{ zIndex: 'var(--z-index-modal)' }}
        >
          <div role='dialog' onClick={e => e.stopPropagation()}>
            <ShareModal
              onClose={popupState.close}
              showModal={popupState.isOpen}
              onAccessControlConditionsSelected={onSubmit}
            />
          </div>
        </BackDrop>
      </Portal>
      <ErrorModal message={apiError} open={errorPopupState.isOpen} onClose={errorPopupState.close} />
    </>
  );
}

export default function TokenGatesWithProvider ({ isAdmin, spaceId }: {isAdmin: boolean, spaceId: string}) {
  return (
    <TokenGatesProvider spaceId={spaceId}>
      <TokenGates isAdmin={isAdmin} spaceId={spaceId} />
    </TokenGatesProvider>
  );
}
