import type { PostPermissionFlags } from '@charmverse/core';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { List, ListItemText, ListItemButton } from '@mui/material';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { useRouter } from 'next/router';

import charmClient from 'charmClient';
import { CopyPageLinkAction } from 'components/common/PageActions/components/CopyPageLinkAction';
import { useProposalCategories } from 'components/proposals/hooks/useProposalCategories';
import { useMembers } from 'hooks/useMembers';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PostWithVotes } from 'lib/forums/posts/interfaces';

import { exportMarkdown } from '../utils/exportMarkdown';

import { DeletePageAction } from './DeletePageAction';
import { DocumentHistory } from './DocumentHistory';
import { ExportMarkdownAction } from './ExportMarkdownAction';
import { ExportToPDFAction } from './ExportToPDFAction';
import { UndoAction } from './UndoAction';

export function ForumPostActionList({
  onComplete,
  undoEditorChanges,
  post,
  postPermissions
}: {
  post?: PostWithVotes; // if post is undefined, it is a new post
  postPermissions?: PostPermissionFlags;
  onComplete: VoidFunction;
  undoEditorChanges: VoidFunction;
}) {
  const { showMessage } = useSnackbar();
  const { getMemberById, members } = useMembers();

  const router = useRouter();

  const { getCategoriesWithCreatePermission, getDefaultCreateCategory } = useProposalCategories();
  const proposalCategoriesWithCreateAllowed = getCategoriesWithCreatePermission();

  const canCreateProposal = proposalCategoriesWithCreateAllowed.length > 0;

  const postCreator = getMemberById(post?.createdBy);

  function deletePost() {
    if (post && postPermissions?.delete_post) {
      charmClient.forum.deleteForumPost(post.id).then(() => {
        router.push(`/${router.query.domain}/forum`);
      });
      onComplete();
    }
  }

  async function exportMarkdownPage() {
    if (post) {
      exportMarkdown({
        content: post.content,
        id: post.id,
        members,
        spaceId: post.spaceId,
        title: post.title
      }).catch(() => {
        showMessage('Error exporting markdown', 'error');
      });
      onComplete();
    }
  }

  async function convertToProposal(pageId: string) {
    onComplete();
    const { path } = await charmClient.forum.convertToProposal({
      postId: pageId,
      categoryId: getDefaultCreateCategory()?.id
    });
    router.push(`/${router.query.domain}/${path}`);
  }

  return (
    <List data-test='header--forum-post-actions' dense>
      <CopyPageLinkAction path={router.asPath} onComplete={onComplete} />
      <Divider />
      <DeletePageAction onClick={deletePost} disabled={!postPermissions?.delete_post} />
      <UndoAction onClick={undoEditorChanges} disabled={!postPermissions?.edit_post} />
      <Divider />
      <ExportMarkdownAction onClick={exportMarkdownPage} />
      <ExportToPDFAction pdfTitle={post?.title} onComplete={onComplete} />
      <Tooltip
        title={
          post?.isDraft
            ? 'Draft post cannot be converted proposal'
            : !canCreateProposal || post?.proposalId
            ? 'You do not have the permission to convert to proposal'
            : ''
        }
      >
        <div>
          <ListItemButton
            data-test='convert-proposal-action'
            onClick={() => post && convertToProposal(post.id)}
            disabled={!canCreateProposal || !!post?.proposalId || !!post?.isDraft}
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
      {post && postCreator ? (
        <>
          <Divider />
          <DocumentHistory page={{ updatedBy: post.createdBy, ...post }} />
        </>
      ) : null}
    </List>
  );
}
