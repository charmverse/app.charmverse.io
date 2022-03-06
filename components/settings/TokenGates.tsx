import Typography from '@mui/material/Typography';
import useSWR from 'swr';
import { v4 as uuid } from 'uuid';
import { ShareModal } from 'lit-modal-vite';
import { ResourceId, checkAndSignAuthMessage, SigningConditions } from 'lit-js-sdk';
import { usePopupState, bindTrigger } from 'material-ui-popup-state/hooks';
import useLitProtocol from 'adapters/litProtocol/hooks/useLitProtocol';
import { TokenGate } from '@prisma/client';
import charmClient from 'charmClient';
import BackDrop from '@mui/material/Backdrop';
import Portal from '@mui/material/Portal';
import Legend from './Legend';
import Button from '../common/Button';
import TokenGatesTable from './TokenGatesTable';

// Example: https://github.com/LIT-Protocol/lit-js-sdk/blob/9b956c0f399493ae2d98b20503c5a0825e0b923c/build/manual_tests.html

type ConditionsModalResult = Pick<SigningConditions, 'accessControlConditions' | 'permanant'>;

export default function TokenGates ({ isAdmin, spaceId }: { isAdmin: boolean, spaceId: string }) {

  const litClient = useLitProtocol();

  const { data, mutate } = useSWR(`tokenGates/${spaceId}`, () => charmClient.getTokenGates({ spaceId }));
  const popupState = usePopupState({ variant: 'popover', popupId: 'token-gate' });

  const spaceResourceId: ResourceId = {
    baseUrl: 'https://app.charmverse.io',
    path: `${Math.random()}`,
    orgId: spaceId,
    role: 'member',
    extraData: ''
  };

  async function onSubmit (conditions: ConditionsModalResult) {
    await saveTokenGate(conditions);
    popupState.close();
  }

  async function saveTokenGate (conditions: Partial<SigningConditions>) {
    const chain = conditions.accessControlConditions![0].chain;
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
    const authSig = await checkAndSignAuthMessage({
      chain
    });
    const success = await litClient?.saveSigningCondition({
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
      {data && data.length === 0 && <Typography color='secondary'>No token gates yet</Typography>}
      {data && data.length > 0 && <TokenGatesTable isAdmin={isAdmin} tokenGates={data} onDelete={deleteTokenGate} />}
      <Portal>
        <BackDrop
          onClick={popupState.close}
          open={popupState.isOpen}
          sx={{ zIndex: 9999 }}
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
    </>
  );
}
