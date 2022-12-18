import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useRef } from 'react';

import charmClient from 'charmClient';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import { useUser } from 'hooks/useUser';
import type { ForumPostPage } from 'lib/forums/posts/interfaces';

import { PostPage } from '../PostPage/PostPage';

interface Props {
  page?: ForumPostPage | null;
  onClose: () => void;
}

export default function PostDialog(props: Props) {
  const { page } = props;
  const mounted = useRef(false);
  const popupState = usePopupState({ variant: 'popover', popupId: 'post-dialog' });

  // keep track if charmeditor is mounted. There is a bug that it calls the update method on closing the modal, but content is empty
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // open modal when page is set
  useEffect(() => {
    if (page) {
      popupState.open();
    }
  }, [!!page]);

  async function onClickDelete() {
    if (page) {
      await charmClient.forum.deleteForumPost(page.id);
      onClose();
    }
  }

  function onClose() {
    popupState.close();
    props.onClose();
  }

  return (
    <RootPortal>
      {popupState.isOpen && (
        <Dialog
          hideCloseButton
          // toolsMenu={
          //   page && (
          //     <PageActions
          //       page={page}
          //       onClickDelete={
          //         user?.id === page.createdBy
          //           ? () => {
          //               onClickDelete();
          //             }
          //           : undefined
          //       }
          //     />
          //   )
          // }
          // toolbar={
          //   <Box display='flex' justifyContent='space-between'>
          //     <Button
          //       size='small'
          //       color='secondary'
          //       href={`/${router.query.domain}/${page?.path}`}
          //       variant='text'
          //       startIcon={<OpenInFullIcon fontSize='small' />}
          //     >
          //       Open as Page
          //     </Button>
          //   </Box>
          // }
          onClose={onClose}
        >
          {page && <PostPage page={page} onPublish={onClose} />}
        </Dialog>
      )}
    </RootPortal>
  );
}
