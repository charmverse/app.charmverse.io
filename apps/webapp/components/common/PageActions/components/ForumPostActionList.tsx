import type { PostPermissionFlags } from '@charmverse/core/permissions';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { List, ListItemText, ListItemButton } from '@mui/material';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';

import charmClient from 'charmClient';
import { CopyPageLinkAction } from 'components/common/PageActions/components/CopyPageLinkAction';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useMembers } from 'hooks/useMembers';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PostWithVotes } from '@packages/lib/forums/posts/interfaces';

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
  postPermissions,
  onDelete
}: {
  post?: PostWithVotes; // if post is undefined, it is a new post
  postPermissions?: PostPermissionFlags;
  onComplete: VoidFunction;
  undoEditorChanges: VoidFunction;
  onDelete?: VoidFunction;
}) {
  const { showMessage } = useSnackbar();
  const { getMemberById, members } = useMembers();
  const [spacePermissions] = useCurrentSpacePermissions();
  const { navigateToSpacePath } = useCharmRouter();

  const canCreateProposal = spacePermissions?.createProposals;

  const postCreator = getMemberById(post?.createdBy);

  function deletePost() {
    if (post && postPermissions?.delete_post) {
      charmClient.forum.deleteForumPost(post.id).then(() => {
        navigateToSpacePath(`/forum`);
      });
      onComplete();
      onDelete?.();
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

  async function convertToProposal(sourcePostId: string) {
    navigateToSpacePath(`/proposals/new`, { sourcePostId });
  }

  return (
    <List data-test='header--forum-post-actions' dense>
      <CopyPageLinkAction path={`/forum/post/${post?.path}`} onComplete={onComplete} />
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
