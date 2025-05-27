import { log } from '@charmverse/core/log';
import type { PagePermissionFlags } from '@charmverse/core/permissions';
import type { PageType } from '@charmverse/core/prisma';
import { styled } from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { List, ListItemButton, ListItemIcon, ListItemText, Switch } from '@mui/material';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import charmClient from 'charmClient';
import { useGetPageMarkdown } from 'charmClient/hooks/pages';
import { usePageSidebar } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import { Button } from 'components/common/Button';
import { SetAsHomePageAction } from 'components/common/PageActions/components/SetAsHomePageAction';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useMembers } from 'hooks/useMembers';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PageUpdates, PageWithContent } from 'lib/pages';
import { lockablePageTypes } from 'lib/pages/constants';
import { fontClassName } from 'theme/fonts';

import { downloadMarkdownFile } from '../utils/downloadMarkdownFile';

import { AddToFavoritesAction } from './AddToFavoritesAction';
import { ArchiveProposalAction } from './ArchiveProposalAction';
import { CopyPageLinkAction } from './CopyPageLinkAction';
import { DocumentHistory } from './DocumentHistory';
import { DuplicatePageAction } from './DuplicatePageAction';
import { ExportMarkdownAction } from './ExportMarkdownAction';
import { ExportToPDFAction } from './ExportToPDFAction';
import { PublishProposalAction } from './PublishProposalAction';
import { RewardActions } from './RewardActions';
import { TogglePageLockAction } from './TogglePageLockAction';
import { UndoAction } from './UndoAction';

export type PageActionMeta = Pick<
  PageWithContent,
  | 'convertedProposalId'
  | 'createdAt'
  | 'createdBy'
  | 'deletedAt'
  | 'fontSizeSmall'
  | 'fontFamily'
  | 'fullWidth'
  | 'id'
  | 'parentId'
  | 'path'
  | 'proposalId'
  | 'syncWithPageId'
  | 'title'
  | 'type'
  | 'updatedAt'
  | 'updatedBy'
  | 'isLocked'
  | 'lockedBy'
>;

export const documentTypes: PageType[] = [
  'page',
  'card',
  'card_synced',
  'card_template',
  'proposal',
  'proposal_template',
  'bounty',
  'bounty_template'
];

const StyledFontButton = styled(Button)`
  display: block;
`;

const FontFamilyExample = styled.div`
  font-size: 24px;
  height: 24px;
  line-height: 24px;
  font-weight: 700;
`;

function DeleteMenuItem({ disabled = false, onClick }: { disabled?: boolean; onClick: VoidFunction }) {
  return (
    <Tooltip title={disabled ? "You don't have permission to delete this page" : ''}>
      <div>
        <ListItemButton data-test='header--delete-current-page' disabled={disabled} onClick={onClick}>
          <ListItemIcon>
            <DeleteOutlineOutlinedIcon fontSize='small' />
          </ListItemIcon>
          <ListItemText primary='Delete' />
        </ListItemButton>
      </div>
    </Tooltip>
  );
}

type Props = {
  onComplete: VoidFunction;
  page: PageActionMeta;
  pagePermissions?: PagePermissionFlags;
  undoEditorChanges?: VoidFunction;
  onDelete?: VoidFunction;
  isInsideDialog?: boolean;
  isStructuredProposal?: boolean;
  refreshPage: VoidFunction;
};
export function DocumentPageActionList({
  isInsideDialog,
  page,
  onComplete,
  onDelete,
  pagePermissions,
  undoEditorChanges,
  isStructuredProposal,
  refreshPage
}: Props) {
  const pageId = page.id;
  const { navigateToSpacePath } = useCharmRouter();
  const { updatePage, deletePage } = usePages();
  const { rewards, mutateRewards: refreshRewards } = useRewards();
  const [spacePermissions] = useCurrentSpacePermissions();
  const { showMessage } = useSnackbar();
  const { members } = useMembers();
  const { setActiveView } = usePageSidebar();
  const pageType = page.type;
  const { trigger: getPageMarkdown } = useGetPageMarkdown(pageId);
  const isExportablePage = documentTypes.includes(pageType as PageType);
  const { space } = useCurrentSpace();
  const basePageBounty = rewards?.find((r) => r.id === pageId);

  const canCreateProposal = spacePermissions?.createProposals && pagePermissions?.edit_content;

  const isLockablePageType = lockablePageTypes.includes(page.type);

  function setPageProperty(prop: Partial<PageUpdates>) {
    updatePage({
      id: pageId,
      ...prop
    });
  }

  function toggleSmallFont() {
    setPageProperty({ fontSizeSmall: !page.fontSizeSmall });
  }

  function toggleFullWidth() {
    setPageProperty({ fullWidth: !page.fullWidth });
  }

  function setFontFamily(fontFamily: 'serif' | 'mono' | 'default') {
    setPageProperty({ fontFamily });
  }

  async function onTogglePageLock() {
    await charmClient.pages.togglePageLock({
      pageId,
      isLocked: !page.isLocked
    });
    await refreshPage();
    onComplete();
  }

  async function onDeletePage() {
    await deletePage({
      pageId
    });
    if (page?.type === 'bounty') {
      refreshRewards((_bounties) => _bounties?.filter((_bounty) => _bounty.id !== page.id));
    }
    onComplete();
    onDelete?.();
  }

  async function exportMarkdownPage() {
    try {
      const markdownContent = await getPageMarkdown();
      await downloadMarkdownFile({
        markdownContent,
        pageId,
        spaceId: space!.id,
        title: page.title
      });
    } catch (error) {
      log.error('Error exporting markdown', { error });
      showMessage('Error exporting markdown', 'error');
      return;
    }
    onComplete();
  }

  const charmversePage = members.find((member) => member.id === page.createdBy);

  async function convertToProposal() {
    navigateToSpacePath(`/proposals/new`, { sourcePageId: page.id });
  }

  return (
    <List data-test='header--page-actions' dense>
      <Box px={2.5} mb={1}>
        <Typography variant='caption'>Style</Typography>
        <Box display='flex' mt={0.5} className={fontClassName}>
          <StyledFontButton
            size='small'
            color={page.fontFamily === 'default' ? 'primary' : 'secondary'}
            variant='text'
            onClick={() => setFontFamily('default')}
          >
            <FontFamilyExample>Aa</FontFamilyExample>
            Default
          </StyledFontButton>
          <StyledFontButton
            size='small'
            color={page.fontFamily === 'serif' ? 'primary' : 'secondary'}
            variant='text'
            onClick={() => setFontFamily('serif')}
          >
            <FontFamilyExample className='font-family-serif'>Aa</FontFamilyExample>
            Serif
          </StyledFontButton>
          <StyledFontButton
            size='small'
            color={page.fontFamily === 'mono' ? 'primary' : 'secondary'}
            variant='text'
            onClick={() => setFontFamily('mono')}
          >
            <FontFamilyExample className='font-family-mono'>Aa</FontFamilyExample>
            Mono
          </StyledFontButton>
        </Box>
      </Box>
      <Divider />
      <ListItemButton>
        <FormControlLabel
          sx={{
            marginLeft: 0.5,
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between'
          }}
          labelPlacement='start'
          control={<Switch size='small' checked={!!page.fontSizeSmall} onChange={toggleSmallFont} />}
          label={<Typography variant='body2'>Small text</Typography>}
        />
      </ListItemButton>
      <ListItemButton>
        <FormControlLabel
          sx={{
            marginLeft: 0.5,
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between'
          }}
          labelPlacement='start'
          control={<Switch size='small' checked={!!page.fullWidth} onChange={toggleFullWidth} />}
          label={<Typography variant='body2'>Full width</Typography>}
        />
      </ListItemButton>
      {!isInsideDialog && (
        <>
          <Divider />
          <ListItemButton
            data-test='view-comments-button'
            disabled={!pagePermissions?.comment}
            onClick={() => {
              setActiveView('comments');
              onComplete();
            }}
          >
            <ListItemIcon>
              <MessageOutlinedIcon fontSize='small' />
            </ListItemIcon>
            <ListItemText primary='View comments' />
          </ListItemButton>
          {!isStructuredProposal && (
            <ListItemButton
              onClick={() => {
                setActiveView('suggestions');
                onComplete();
              }}
            >
              <ListItemIcon>
                <RateReviewOutlinedIcon fontSize='small' />
              </ListItemIcon>
              <ListItemText primary='View suggestions' />
            </ListItemButton>
          )}
        </>
      )}
      <Divider />
      {(page.type === 'card' || page.type === 'card_synced' || page.type === 'page') && (
        <>
          <AddToFavoritesAction pageId={pageId} onComplete={onComplete} />
          <SetAsHomePageAction pageId={pageId} onComplete={onComplete} />
        </>
      )}
      {isLockablePageType && (
        <TogglePageLockAction
          isLocked={!!page.isLocked}
          onClick={onTogglePageLock}
          disabled={!pagePermissions?.edit_lock}
        />
      )}
      {page && (
        <DuplicatePageAction
          onComplete={onComplete}
          pageId={pageId}
          pageType={page.type}
          pagePermissions={pagePermissions}
          redirect
        />
      )}
      <CopyPageLinkAction path={`/${page.path}`} onComplete={onComplete} />

      <Divider sx={{ my: '0 !important' }} />
      {(page.type === 'card' || page.type === 'card_synced' || page.type === 'page') && (
        <>
          <Tooltip title={!canCreateProposal ? 'You do not have the permission to convert to proposal' : ''}>
            <div>
              <ListItemButton
                data-test='convert-proposal-action'
                onClick={convertToProposal}
                disabled={!canCreateProposal || !!page.convertedProposalId}
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
          <Divider />
        </>
      )}

      <DeleteMenuItem
        onClick={onDeletePage}
        disabled={!pagePermissions?.delete || page.deletedAt !== null || !!page.syncWithPageId}
      />
      {page.proposalId && <ArchiveProposalAction proposalId={page.proposalId} />}
      {page.proposalId && <PublishProposalAction proposalId={page.proposalId} />}
      {undoEditorChanges && <UndoAction onClick={undoEditorChanges} disabled={!pagePermissions?.edit_content} />}
      <Divider />
      <ExportMarkdownAction disabled={!isExportablePage} onClick={exportMarkdownPage} />
      <ExportToPDFAction pdfTitle={page.title} onComplete={onComplete} />
      {pageType === 'bounty' && basePageBounty && (
        <>
          <Divider />
          <RewardActions rewardId={basePageBounty.id} onClick={onComplete} />
        </>
      )}
      {charmversePage && (
        <>
          <Divider />
          <DocumentHistory page={page} />
        </>
      )}
    </List>
  );
}
