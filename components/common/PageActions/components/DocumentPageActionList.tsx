import type { PageType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { List, Switch, ListItemText, ListItemButton } from '@mui/material';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useProposalCategories } from 'components/proposals/hooks/useProposalCategories';
import { useBounties } from 'hooks/useBounties';
import { useMembers } from 'hooks/useMembers';
import { usePageActionDisplay } from 'hooks/usePageActionDisplay';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import type { PageMeta, PageUpdates } from 'lib/pages';
import type { IPagePermissionFlags } from 'lib/permissions/pages';
import { fontClassName } from 'theme/fonts';

import { exportMarkdown } from '../utils/exportMarkdown';

import { AddToFavoritesAction } from './AddToFavoritesAction';
import { BountyActions } from './BountyActions';
import { CopyPageLinkAction } from './CopyPageLinkAction';
import { DocumentHistory } from './DocumentHistory';
import { DuplicatePageAction } from './DuplicatePageAction';
import { ExportMarkdownAction } from './ExportMarkdownAction';
import { ExportToPDFAction } from './ExportToPDFAction';
import { PublishToSnapshot } from './SnapshotAction/PublishToSnapshot';
import { UndoAction } from './UndoAction';

export type PageActionMeta = Pick<
  PageMeta,
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
  | 'title'
  | 'type'
  | 'updatedAt'
  | 'updatedBy'
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
          <DeleteOutlineOutlinedIcon
            fontSize='small'
            sx={{
              mr: 1
            }}
          />
          <ListItemText primary='Delete' />
        </ListItemButton>
      </div>
    </Tooltip>
  );
}

type Props = {
  onComplete: VoidFunction;
  page: PageActionMeta;
  pagePermissions?: IPagePermissionFlags;
  undoEditorChanges?: VoidFunction;
};

export function DocumentPageActionList({ page, onComplete, pagePermissions, undoEditorChanges }: Props) {
  const pageId = page.id;
  const router = useRouter();
  const { updatePage, deletePage } = usePages();
  const { bounties } = useBounties();
  const { showMessage } = useSnackbar();
  const { members } = useMembers();
  const { setBounties } = useBounties();
  const { setCurrentPageActionDisplay } = usePageActionDisplay();
  const pageType = page.type;
  const isExportablePage = documentTypes.includes(pageType as PageType);
  const { getCategoriesWithCreatePermission, getDefaultCreateCategory } = useProposalCategories();
  const proposalCategoriesWithCreateAllowed = getCategoriesWithCreatePermission();
  const canCreateProposal = proposalCategoriesWithCreateAllowed.length > 0;
  const basePageBounty = bounties.find((bounty) => bounty.id === pageId);
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

  async function onDeletePage() {
    await deletePage({
      pageId
    });
    if (page?.type === 'bounty') {
      setBounties((_bounties) => _bounties.filter((_bounty) => _bounty.id !== page.id));
    }
    onComplete();
  }

  async function exportMarkdownPage() {
    const _page = await charmClient.pages.getPage(pageId);
    exportMarkdown({
      content: _page.content,
      id: _page.id,
      members,
      spaceId: _page.spaceId,
      title: _page.title
    }).catch(() => {
      showMessage('Error exporting markdown', 'error');
    });
    onComplete();
  }

  const charmversePage = members.find((member) => member.id === page.createdBy);

  async function convertToProposal() {
    const convertedProposal = await charmClient.pages.convertToProposal({
      categoryId: getDefaultCreateCategory().id,
      pageId
    });
    onComplete();
    router.push(`/${router.query.domain}/${convertedProposal.path}`);
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
      <Divider />
      <ListItemButton
        onClick={() => {
          setCurrentPageActionDisplay('comments');
          onComplete();
        }}
      >
        <MessageOutlinedIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='View comments' />
      </ListItemButton>
      <ListItemButton
        onClick={() => {
          setCurrentPageActionDisplay('suggestions');
          onComplete();
        }}
      >
        <RateReviewOutlinedIcon
          fontSize='small'
          sx={{
            mr: 1
          }}
        />
        <ListItemText primary='View suggestions' />
      </ListItemButton>
      <Divider />
      {(page.type === 'card' || page.type === 'card_synced' || page.type === 'page') && (
        <AddToFavoritesAction pageId={pageId} onComplete={onComplete} />
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
      <CopyPageLinkAction path={router.asPath} onComplete={onComplete} />

      <Divider />
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
      <DeleteMenuItem onClick={onDeletePage} disabled={!pagePermissions?.delete || page.deletedAt !== null} />
      {undoEditorChanges && <UndoAction onClick={undoEditorChanges} disabled={!pagePermissions?.edit_content} />}
      <Divider />
      <PublishToSnapshot
        pageId={pageId}
        renderContent={({ label, onClick, icon }) => (
          <ListItemButton onClick={onClick}>
            {icon}
            <ListItemText primary={label} />
          </ListItemButton>
        )}
      />
      <ExportMarkdownAction disabled={!isExportablePage} onClick={exportMarkdownPage} />
      <ExportToPDFAction pdfTitle={page.title} onComplete={onComplete} />
      {pageType === 'bounty' && basePageBounty && (
        <>
          <Divider />
          <BountyActions bountyId={basePageBounty.id} onClick={onComplete} />
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
