import type { ApiPageKey } from '@charmverse/core/prisma';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Box, Grid, Tooltip, Typography } from '@mui/material';
import { webhookEndpoint } from '@packages/config/constants';
import type { Board, DataSourceType } from '@packages/databases/board';
import { createBoardView, type BoardView } from '@packages/databases/boardView';
import mutator from '@packages/databases/mutator';
import type { SelectedProposalProperties } from '@packages/databases/proposalsSource/interfaces';
import { initialDatabaseLoad } from '@packages/databases/store/databaseBlocksLoad';
import { useAppDispatch } from '@packages/databases/store/hooks';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRef, useState } from 'react';
import { BsFiletypeCsv } from 'react-icons/bs';
import { RiGoogleFill } from 'react-icons/ri';
import { SiTypeform } from 'react-icons/si';
import { TbDatabase } from 'react-icons/tb';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import ConfirmApiPageKeyModal from 'components/common/Modal/ConfirmApiPageKeyModal';
import { PageIcon } from 'components/common/PageIcon';
import { useIsAdmin } from 'hooks/useIsAdmin';

import { DatabaseSidebarHeader } from '../databaseSidebarHeader';

import { GoogleFormsSource } from './components/GoogleForms/GoogleFormsSource';
import { LinkCharmVerseDatabase } from './components/LinkCharmVerseDatabase';
import { NewCharmVerseDatabase } from './components/NewCharmVerseDatabase';
import { ProposalSourcePropertiesDialog } from './components/ProposalSourceProperties/ProposalSourcePropertiesDialog';
import { SourceType } from './components/viewSourceType';
import { useSourceOptions } from './useSourceOptions';

type FormStep = 'select_source' | 'configure_source';

type SourceOptions =
  | 'new'
  | 'linked'
  | 'csv'
  | 'proposals'
  | 'google_form'
  | 'typeform'
  | 'reward_applications'
  | 'rewards';

type ViewSourceOptionsProps = {
  closeSidebar?: () => void;
  closeSourceOptions?: () => void;
  title?: string;
  view?: BoardView;
  views: BoardView[];
  rootBoard: Board;
  showView: (viewId: string) => void;
  isReward?: boolean;
};

export function ViewSourceOptions(props: ViewSourceOptionsProps) {
  const { view: activeView, views, rootBoard, title, closeSourceOptions, closeSidebar, showView, isReward } = props;
  const proposalSourcePropertiesPopupState = usePopupState({
    variant: 'dialog'
  });
  const dispatch = useAppDispatch();
  const { onCreateDatabase, onCsvImport, onSelectLinkedDatabase, onSelectSourceGoogleForm } = useSourceOptions({
    rootBoard,
    activeView,
    showView
  });

  const isAdmin = useIsAdmin();

  const rootDatabaseId = rootBoard.id;

  const rootIsLinkedBoard = !!String(rootBoard?.pageType).match('linked');

  const linkedSourceId = activeView?.fields.linkedSourceId;

  const activeSourceType = rootBoard?.fields.sourceType ?? activeView?.fields.sourceType;

  const [sourceType, setSourceType] = useState<DataSourceType | undefined>(
    activeSourceType === 'google_form' ? 'google_form' : rootIsLinkedBoard ? 'board_page' : undefined
  );
  const [formStep, setStep] = useState<FormStep>(
    (rootIsLinkedBoard && views.length > 0) || activeSourceType === 'google_form' ? 'configure_source' : 'select_source'
  );

  const isCreatingProposals = useRef(false);

  let allowedSourceOptions: SourceOptions[] = [];

  if (isReward) {
    allowedSourceOptions = ['reward_applications', 'rewards'];
  } else if (rootIsLinkedBoard && activeSourceType !== 'google_form' && props.views.length > 0) {
    allowedSourceOptions.push('linked');
    // Databases start out as linked pages. As long as they are not already linked, we can offer all options
  } else if (views.length === 0) {
    allowedSourceOptions.push(...(['new', 'linked', 'google_form', 'proposals', 'typeform', 'csv'] as SourceOptions[]));
    // Only allow Google form to be used once this is connected
  } else if (activeSourceType === 'google_form') {
    allowedSourceOptions.push('google_form');
  } else if (!linkedSourceId && activeSourceType !== 'proposals') {
    allowedSourceOptions.push(...(['typeform', 'csv'] as SourceOptions[]));
  }

  const {
    data: webhookApi,
    trigger: createWebhookApiKey,
    isMutating: isLoadingWebhookApiKeyCreation
  } = useSWRMutation(
    `/api/api-page-key`,
    (_url, { arg }: Readonly<{ arg: { pageId: string; type: ApiPageKey['type'] } }>) =>
      charmClient.createApiPageKey(arg)
  );

  const { trigger: createProposalSource, isMutating: isLoadingProposalSource } = useSWRMutation(
    `/api/pages/${rootDatabaseId}/proposal-source`,
    (_url, { arg }: Readonly<{ arg: { pageId: string; selectedProperties: SelectedProposalProperties } }>) =>
      charmClient.createProposalSource(arg)
  );

  const handleRewardSource = async (_sourceType: Extract<DataSourceType, 'rewards' | 'reward_applications'>) => {
    if (!activeView || activeView.fields.viewType !== 'board') {
      return;
    }

    const oldBlocks = [activeView];
    const newBoard = createBoardView(activeView);
    newBoard.fields.sourceType = _sourceType;
    await mutator.updateBlocks([newBoard], oldBlocks, 'Update rewards board source type');
  };

  const typeformPopup = usePopupState({ variant: 'popover', popupId: 'typeformPopup' });

  async function handleApiKeyClick(type: ApiPageKey['type']) {
    if (rootDatabaseId) {
      await createWebhookApiKey({ pageId: rootDatabaseId, type });
      typeformPopup.open();
    }
  }

  async function handleProposalSource(selectedProperties: SelectedProposalProperties) {
    if (rootDatabaseId) {
      await onCreateDatabase?.({ sourceType: 'proposals' });
      await createProposalSource({ pageId: rootDatabaseId, selectedProperties });
      dispatch(initialDatabaseLoad({ pageId: rootDatabaseId }));
    }
  }

  function selectSourceType(_source: DataSourceType) {
    return () => {
      setSourceType(_source);
      setStep('configure_source');
    };
  }

  function goToSelectSource() {
    setStep('select_source');
  }

  const goBackFunction =
    formStep === 'select_source' || allowedSourceOptions.length <= 1 ? closeSourceOptions : goToSelectSource;

  return (
    <>
      <DatabaseSidebarHeader goBack={goBackFunction} title={title} onClose={closeSidebar} />
      <Box onClick={(e) => e.stopPropagation()}>
        {formStep === 'select_source' && (
          <Grid container spacing={1} px={1}>
            {(allowedSourceOptions.includes('linked') || allowedSourceOptions.includes('new')) && (
              <SourceType
                data-test='source-linked-database'
                active={activeSourceType === 'board_page'}
                onClick={selectSourceType('board_page')}
              >
                <TbDatabase style={{ fontSize: 24 }} />
                CharmVerse database
              </SourceType>
            )}

            {/** Only admins can create proposals as datasource, to avoid accidentally revealing proposal data */}
            {allowedSourceOptions.includes('proposals') && (
              <SourceType
                disabled={!isAdmin}
                data-test='source-proposals'
                disabledTooltip='Only admins can create proposals as datasource boards'
                active={activeSourceType === 'proposals'}
                onClick={isLoadingProposalSource ? undefined : proposalSourcePropertiesPopupState.open}
              >
                <TaskOutlinedIcon fontSize='small' />
                Charmverse Proposals
              </SourceType>
            )}

            {allowedSourceOptions.includes('csv') && (
              <SourceType active={false} component='label' htmlFor='dbcsvfile'>
                <input
                  hidden
                  type='file'
                  id='dbcsvfile'
                  name='dbcsvfile'
                  accept='.csv'
                  onChange={(event) => {
                    if (event.target.files && event.target.files[0]) {
                      onCsvImport(event);
                    }
                    event.target.value = '';
                  }}
                />
                <BsFiletypeCsv style={{ fontSize: 24 }} />
                Import CSV
              </SourceType>
            )}

            {allowedSourceOptions.includes('google_form') && (
              <SourceType active={activeSourceType === 'google_form'} onClick={selectSourceType('google_form')}>
                <RiGoogleFill style={{ fontSize: 24 }} />
                Google Form
              </SourceType>
            )}

            {allowedSourceOptions.includes('typeform') && (
              <SourceType
                active={false}
                onClick={() => (isLoadingWebhookApiKeyCreation ? {} : handleApiKeyClick('typeform'))}
              >
                <SiTypeform style={{ fontSize: 24 }} />
                Typeform
              </SourceType>
            )}
            {allowedSourceOptions.includes('new') && (
              <SourceType data-test='source-new-database' onClick={onCreateDatabase}>
                <AddCircleIcon style={{ fontSize: 24 }} />
                New database
              </SourceType>
            )}
            {allowedSourceOptions.includes('rewards') && (
              <SourceType data-test='source-new-rewards' onClick={() => handleRewardSource('rewards')}>
                <PageIcon pageType='rewards' style={{ fontSize: 24 }} />
                Rewards
              </SourceType>
            )}
            {allowedSourceOptions.includes('reward_applications') && (
              <SourceType
                data-test='source-new-reward-applications'
                onClick={() => handleRewardSource('reward_applications')}
              >
                <DescriptionOutlinedIcon style={{ fontSize: 24 }} />
                Submissions
              </SourceType>
            )}
          </Grid>
        )}
        {formStep === 'configure_source' && sourceType === 'board_page' && (
          <>
            <LinkCharmVerseDatabase
              onSelectLinkedDatabase={onSelectLinkedDatabase}
              currentSourceDatabaseId={activeView?.fields.linkedSourceId}
            />
            {allowedSourceOptions.includes('new') && (
              <NewCharmVerseDatabase onCreateDatabase={onCreateDatabase as any} />
            )}
          </>
        )}
        {formStep === 'configure_source' && sourceType === 'google_form' && (
          <GoogleFormsSource
            activeFormId={activeView?.fields.sourceData?.formId}
            activeCredential={activeView?.fields.sourceData?.credentialId}
            onSelectSourceGoogleForm={onSelectSourceGoogleForm}
          />
        )}
      </Box>
      <ConfirmApiPageKeyModal
        question={
          <Typography sx={{ wordBreak: 'break-word' }}>
            Go to your typeform form and click Connect - Webhooks - Add a Webhook
            <br />
            Paste the following URL:
            <br />
            <i>{`${window.location.origin}/${webhookEndpoint}/${webhookApi?.apiKey}`}</i>
          </Typography>
        }
        title='Typeform webhook'
        open={typeformPopup.isOpen}
        onClose={typeformPopup.close}
        onConfirm={() => {
          onCreateDatabase?.();
          typeformPopup.close();
        }}
      />
      {proposalSourcePropertiesPopupState.isOpen && (
        <ProposalSourcePropertiesDialog
          onClose={proposalSourcePropertiesPopupState.close}
          onApply={async (selectedProperties) => {
            if (!isCreatingProposals.current) {
              isCreatingProposals.current = true;
              selectSourceType('proposals');
              handleProposalSource(selectedProperties);
            }
          }}
        />
      )}
    </>
  );
}
