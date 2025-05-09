import { Stack, Typography } from '@mui/material';

import { useRemoveRelationProperty } from 'charmClient/hooks/blocks';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { usePages } from 'hooks/usePages';
import type { Board, IPropertyTemplate } from '@packages/databases/board';

export function DeleteRelationPropertyModal({
  board,
  onClose,
  template
}: {
  onClose: () => void;
  board: Board;
  template: IPropertyTemplate;
}) {
  const { pages } = usePages();
  const relationData = template.relationData;
  const connectedBoardPage = relationData ? pages[relationData.boardId] : null;
  const { trigger: removeRelationProperty } = useRemoveRelationProperty();

  return (
    <Modal size='500px' open title='Delete relation property' onClose={onClose}>
      <Stack p={2}>
        <Typography>
          This property has a related property on {connectedBoardPage?.title || 'Untitled'} which will also be deleted.
        </Typography>
        <Stack spacing={1} mt={3}>
          <Button
            color='error'
            variant='outlined'
            onClick={() => {
              removeRelationProperty({
                removeBoth: true,
                boardId: board.id,
                templateId: template.id
              });
              onClose();
            }}
          >
            Delete
          </Button>
          <Button
            color='error'
            variant='outlined'
            onClick={() => {
              removeRelationProperty({
                removeBoth: false,
                boardId: board.id,
                templateId: template.id
              });
              onClose();
            }}
          >
            Delete, but keep related property
          </Button>
          <Button variant='outlined' color='secondary' onClick={onClose}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
