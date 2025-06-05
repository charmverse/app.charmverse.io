import { Stack } from '@mui/material';
import type { Board } from '@packages/databases/board';
import { createSelectedPropertiesStateFromBoardProperties } from '@packages/databases/proposalsSource/createSelectedPropertiesFromBoardProperties';
import type { SelectedProposalProperties } from '@packages/databases/proposalsSource/interfaces';
import { initialDatabaseLoad } from '@packages/databases/store/databaseBlocksLoad';
import { useAppDispatch } from '@packages/databases/store/hooks';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useMemo } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { useProposalsBoardAdapter } from 'components/proposals/ProposalPage/components/ProposalProperties/hooks/useProposalsBoardAdapter';
import { useIsAdmin } from 'hooks/useIsAdmin';

import { ProposalSourcePropertiesDialog } from './ProposalSourcePropertiesDialog';

export function ProposalSourceDialogButton({ board }: { board: Board }) {
  const { proposalTemplates } = useProposalTemplates({
    detailed: true
  });
  const { trigger: createProposalSource, isMutating: isLoadingProposalSource } = useSWRMutation(
    `/api/pages/${board.id}/proposal-source`,
    (_url, { arg }: Readonly<{ arg: { pageId: string; selectedProperties: SelectedProposalProperties } }>) =>
      charmClient.createProposalSource(arg)
  );
  const isAdmin = useIsAdmin();
  const { boardCustomProperties } = useProposalsBoardAdapter();
  const dispatch = useAppDispatch();

  const proposalSourcePropertiesPopupState = usePopupState({
    variant: 'dialog'
  });
  const proposalSourceSelectedProperties = useMemo(() => {
    return createSelectedPropertiesStateFromBoardProperties({
      cardProperties: board.fields.cardProperties,
      proposalCustomProperties: boardCustomProperties.fields.cardProperties,
      proposalTemplates: proposalTemplates ?? []
    });
  }, [proposalTemplates, board.fields.cardProperties, boardCustomProperties.fields.cardProperties]);

  return (
    <>
      <Stack justifyContent='center' direction='row'>
        <Button
          variant='outlined'
          color='secondary'
          disabled={!isAdmin}
          disabledTooltip='You do not have permission to update proposal properties'
          onClick={isAdmin ? proposalSourcePropertiesPopupState.open : undefined}
          sx={{
            m: 2,
            mt: 1
          }}
          size='small'
          loading={isLoadingProposalSource}
        >
          Select proposal properties
        </Button>
      </Stack>
      {proposalSourcePropertiesPopupState.isOpen && (
        <ProposalSourcePropertiesDialog
          onClose={proposalSourcePropertiesPopupState.close}
          onApply={async (selectedProperties) => {
            await createProposalSource({
              pageId: board.id,
              selectedProperties
            });
            await dispatch(initialDatabaseLoad({ pageId: board.id }));
            proposalSourcePropertiesPopupState.close();
          }}
          initialSelectedProperties={proposalSourceSelectedProperties}
        />
      )}
    </>
  );
}
