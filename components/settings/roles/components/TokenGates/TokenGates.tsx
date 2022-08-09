import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useRouter } from 'next/router';
import { useWeb3React } from '@web3-react/core';
import { ResourceId, checkAndSignAuthMessage, SigningConditions } from 'lit-js-sdk';
import LitShareModal from 'lit-share-modal-v3-react-17';
import Modal, { ErrorModal } from 'components/common/Modal';
import { usePopupState, bindPopover, bindTrigger } from 'material-ui-popup-state/hooks';
import useLitProtocol from 'adapters/litProtocol/hooks/useLitProtocol';
import { TokenGate } from '@prisma/client';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import charmClient from 'charmClient';
import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';
import { Box } from '@mui/material';
import Button from 'components/common/Button';
import { useSnackbar } from 'hooks/useSnackbar';
import useSWR from 'swr';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import getLitChainFromChainId from 'lib/token-gates/getLitChainFromChainId';
import Legend from '../../../Legend';
import TokenGatesTable from './components/TokenGatesTable';

const ShareModalContainer = styled.div`

  width: 100%;

  .lsm-share-modal-container {
    min-height: 500px;
  }

  .lsm-single-condition-select-container,
  .lsm-condition-display,
  .lsm-condition-container,
  .lsm-review-conditions-group-container {
    overflow-y: auto !important;
  }
  /* Remove position: absolute so we have a dynamic height */
  .lsm-condition-display,
  .lsm-review-conditions-container,
  .lsm-single-condition-multiple-button,
  .lsm-lit-footer,
  // container when selecting multiple conditions
  .lsm-multiple-conditions-container {
    position: relative;
    top: 0;
  }
`;

// Example: https://github.com/LIT-Protocol/lit-js-sdk/blob/9b956c0f399493ae2d98b20503c5a0825e0b923c/build/manual_tests.html
// Docs: https://www.npmjs.com/package/lit-share-modal-v3

type ConditionsModalResult = Pick<SigningConditions, 'unifiedAccessControlConditions' | 'permanant'> & { chains: string[] };

export default function TokenGates ({ isAdmin, spaceId }: { isAdmin: boolean, spaceId: string }) {
  const deletePopupState = usePopupState({ variant: 'popover', popupId: 'token-gate-delete' });
  const [removedTokenGate, setRemovedTokenGate] = useState<TokenGate | null>(null);

  const theme = useTheme();
  const litClient = useLitProtocol();
  const { chainId } = useWeb3React();
  const router = useRouter();
  const popupState = usePopupState({ variant: 'popover', popupId: 'token-gate' });
  const errorPopupState = usePopupState({ variant: 'popover', popupId: 'token-gate-error' });
  const { showMessage } = useSnackbar();
  const [apiError, setApiError] = useState<string>('');
  const { data, mutate } = useSWR(`tokenGates/${spaceId}`, () => charmClient.getTokenGates({ spaceId }));

  const shareLink = `https://app.charmverse.io/join?domain=${router.query.domain}`;

  function onSubmit (conditions: ConditionsModalResult) {
    setApiError('');
    return saveTokenGate(conditions)
      .then(() => {
        popupState.close();
      })
      .catch(error => {
        setApiError(error.message || error);
        errorPopupState.open();
      });
  }

  function closeTokenGateDeleteModal () {
    setRemovedTokenGate(null);
    deletePopupState.close();
  }

  async function saveTokenGate (conditions: ConditionsModalResult) {
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

    const authSig = await checkAndSignAuthMessage({ chain });
    await litClient!.saveSigningCondition({
      ...conditions,
      chain,
      authSig,
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
    setRemovedTokenGate(tokenGate);
    deletePopupState.open();
  }

  function onCopy () {
    showMessage('Link copied to clipboard');
  }

  return (
    <>
      <Legend sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span>
          <div>Token Gates</div>
          <Typography variant='caption' component='p'>
            Control access to your workspace automatically with tokens/NFTs.
            <br />Optionally, associate specific token condition with a role to fine-tune membership access.
          </Typography>
        </span>
        <Box display='flex' gap={1}>
          <CopyToClipboard text={shareLink} onCopy={onCopy}>
            <Button href={shareLink} external target='_blank' onClick={(e: any) => e.preventDefault()} variant='outlined'>
              Copy Invite Link
            </Button>
          </CopyToClipboard>
          {isAdmin && (
            <Button
              {...bindTrigger(popupState)}
            >
              Add a gate
            </Button>
          )}
        </Box>
      </Legend>
      {data && data.length === 0 && <Typography color='secondary'>No token gates yet</Typography>}
      {data && data?.length > 0
        && <TokenGatesTable isAdmin={isAdmin} tokenGates={data} onDelete={deleteTokenGate} />}
      <Modal {...bindPopover(popupState)} noPadding size='large'>
        <ShareModalContainer>
          <LitShareModal
            darkMode={theme.palette.mode === 'dark'}
            injectCSS={false}
            permanentDefault={true}
            isModal={false}
            onUnifiedAccessControlConditionsSelected={onSubmit}
          />
        </ShareModalContainer>
      </Modal>
      <ErrorModal message={apiError} open={errorPopupState.isOpen} onClose={errorPopupState.close} />
      {removedTokenGate && (
      <ConfirmDeleteModal
        title='Delete token gate'
        onClose={closeTokenGateDeleteModal}
        open={deletePopupState.isOpen}
        buttonText='Delete token gate'
        question='Are you sure you want to delete this invite link?'
        onConfirm={async () => {
          await charmClient.deleteTokenGate(removedTokenGate.id);
          // update the list of links
          await mutate();
          setRemovedTokenGate(null);
        }}
      />
      )}
    </>
  );
}
