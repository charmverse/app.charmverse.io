import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { List, ListItemText, ListItemButton } from '@mui/material';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { useRouter } from 'next/router';
import type { Dispatch, SetStateAction } from 'react';

import charmClient from 'charmClient';
import { CopyPageLinkAction } from 'components/common/PageActions/components/CopyPageLinkAction';
import type { usePostByPath } from 'components/forum/hooks/usePostByPath';
import { useProposalCategories } from 'components/proposals/hooks/useProposalCategories';
import { useMembers } from 'hooks/useMembers';
import { useSnackbar } from 'hooks/useSnackbar';

import { exportMarkdown } from '../utils/exportMarkdown';

import { DeletePageAction } from './DeletePageAction';
import { DocumentHistory } from './DocumentHistory';
import { ExportMarkdownAction } from './ExportMarkdownAction';
import { ExportToPDFAction } from './ExportToPDFAction';
import { UndoAction } from './UndoAction';

export function ForumPostActionList({
  closeMenu,
  undoEditorChanges,
  forumPostInfo
}: {
  forumPostInfo: ReturnType<typeof usePostByPath>;
  closeMenu: VoidFunction;
  undoEditorChanges: VoidFunction;
}) {
  const { showMessage } = useSnackbar();
  const { getMemberById, members } = useMembers();

  const router = useRouter();

  const { getCategoriesWithCreatePermission, getDefaultCreateCategory } = useProposalCategories();
  const proposalCategoriesWithCreateAllowed = getCategoriesWithCreatePermission();

  const canCreateProposal = proposalCategoriesWithCreateAllowed.length > 0;

  const postCreator = getMemberById(forumPostInfo.forumPost?.createdBy);

  function deletePost() {
    if (forumPostInfo.forumPost) {
      charmClient.forum.deleteForumPost(forumPostInfo.forumPost.id).then(() => {
        router.push(`/${router.query.domain}/forum`);
      });
    }
  }

  async function exportMarkdownPage() {
    if (forumPostInfo.forumPost) {
      exportMarkdown({
        content: forumPostInfo.forumPost.content,
        id: forumPostInfo.forumPost.id,
        members,
        spaceId: forumPostInfo.forumPost.spaceId,
        title: forumPostInfo.forumPost.title
      }).catch(() => {
        showMessage('Error exporting markdown', 'error');
      });
      closeMenu();
    }
  }

  async function convertToProposal(pageId: string) {
    closeMenu();
    const { path } = await charmClient.forum.convertToProposal({
      postId: pageId,
      categoryId: getDefaultCreateCategory()?.id
    });
    router.push(`/${router.query.domain}/${path}`);
  }

  return (
    <List data-test='header--forum-post-actions' dense>
      <CopyPageLinkAction path={router.asPath} closeMenu={closeMenu} />
      <Divider />
      <DeletePageAction onClick={deletePost} disabled={!forumPostInfo.permissions?.delete_post} />
      <UndoAction onClick={undoEditorChanges} disabled={!forumPostInfo?.permissions?.edit_post} />
      <Divider />
      <ExportMarkdownAction onClick={exportMarkdownPage} />
      <ExportToPDFAction pdfTitle={forumPostInfo.forumPost?.title} />
      <Tooltip
        title={
          forumPostInfo.forumPost?.isDraft
            ? 'Draft post cannot be converted proposal'
            : !canCreateProposal || forumPostInfo.forumPost?.proposalId
            ? 'You do not have the permission to convert to proposal'
            : ''
        }
      >
        <div>
          <ListItemButton
            data-test='convert-proposal-action'
            onClick={() => forumPostInfo.forumPost && convertToProposal(forumPostInfo.forumPost.id)}
            disabled={!canCreateProposal || !!forumPostInfo.forumPost?.proposalId || !!forumPostInfo.forumPost?.isDraft}
          >
            <TaskOutlinedIcon
              fontSize='small'
              sx={{
                mr: 1
              }}
            />
            <ListItemText primary='Convert to proposal' />
          </ListItemButton>
        </div>
      </Tooltip>
      {forumPostInfo.forumPost && postCreator ? (
        <>
          <Divider />
          <DocumentHistory page={{ updatedBy: forumPostInfo.forumPost.createdBy, ...forumPostInfo.forumPost }} />
        </>
      ) : null}
    </List>
  );
}
