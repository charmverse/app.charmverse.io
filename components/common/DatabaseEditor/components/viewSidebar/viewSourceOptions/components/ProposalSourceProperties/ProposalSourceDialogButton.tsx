import { usePopupState } from 'material-ui-popup-state/hooks';
import { useMemo } from 'react';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import type { Board } from 'lib/databases/board';
import { createSelectedPropertiesStateFromBoardProperties } from 'lib/databases/proposalsSource/createSelectedPropertiesFromBoardProperties';

import type { SelectedProperties } from './ProposalSourcePropertiesDialog';
import { ProposalSourcePropertiesDialog } from './ProposalSourcePropertiesDialog';

export function ProposalSourceDialogButton({ board }: { board: Board }) {
  const { trigger: createProposalSource, isMutating: isLoadingProposalSource } = useSWRMutation(
    `/api/pages/${board.id}/proposal-source`,
    (_url, { arg }: Readonly<{ arg: { pageId: string; selectedProperties: SelectedProperties } }>) =>
      charmClient.createProposalSource(arg)
  );

  const proposalSourcePropertiesPopupState = usePopupState({
    variant: 'dialog'
  });
  const proposalSourceSelectedProperties = useMemo(() => {
    return createSelectedPropertiesStateFromBoardProperties({
      cardProperties: board.fields.cardProperties
    });
  }, [board.fields.cardProperties]);

  return (
    <>
      <Button
        variant='outlined'
        color='secondary'
        onClick={proposalSourcePropertiesPopupState.open}
        sx={{
          m: 2
        }}
        loading={isLoadingProposalSource}
      >
        Edit properties
      </Button>
      {proposalSourcePropertiesPopupState.isOpen && (
        <ProposalSourcePropertiesDialog
          onClose={proposalSourcePropertiesPopupState.close}
          onApply={(selectedProperties) => {
            createProposalSource({
              pageId: board.id,
              selectedProperties
            }).then(proposalSourcePropertiesPopupState.close);
          }}
          initialSelectedProperties={proposalSourceSelectedProperties}
        />
      )}
    </>
  );
}
