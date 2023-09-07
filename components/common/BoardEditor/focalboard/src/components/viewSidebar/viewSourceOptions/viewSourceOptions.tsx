import type { ApiPageKey } from '@charmverse/core/prisma';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Box, Grid, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRef, useState } from 'react';
import { BsFiletypeCsv } from 'react-icons/bs';
import { RiGoogleFill } from 'react-icons/ri';
import { SiTypeform } from 'react-icons/si';
import { TbDatabase } from 'react-icons/tb';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import ConfirmApiPageKeyModal from 'components/common/Modal/ConfirmApiPageKeyModal';
import { webhookEndpoint } from 'config/constants';
import { usePages } from 'hooks/usePages';
import type { Board, DataSourceType } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';

import { DatabaseSidebarHeader } from '../databaseSidebarHeader';

import { GoogleFormsSource } from './components/GoogleForms/GoogleFormsSource';
import { LinkCharmVerseDatabase } from './components/LinkCharmVerseDatabase';
import { NewCharmVerseDatabase } from './components/NewCharmVerseDatabase';
import { SourceType } from './components/viewSourceType';
import { useSourceOptions } from './useSourceOptions';

type FormStep = 'select_source' | 'configure_source';

type SourceOptions = 'new' | 'linked' | 'csv' | 'proposals' | 'google_form' | 'typeform';

type ViewSourceOptionsProps = {
  closeSidebar?: () => void;
  closeSourceOptions?: () => void;
  title?: string;
  view?: BoardView;
  views: BoardView[];
  rootBoard: Board;
  showView: (viewId: string) => void;
};

export function ViewSourceOptions(props: ViewSourceOptionsProps) {
  const { view: activeView, views, rootBoard, title, closeSourceOptions, closeSidebar, showView } = props;

  const { onCreateDatabase, onCsvImport, onSelectLinkedDatabase, onSelectSourceGoogleForm } = useSourceOptions({
    rootBoard,
    activeView,
    showView
  });

  const { pages } = usePages();

  const rootDatabaseId = rootBoard.id;

  const rootBoardPage = pages[rootBoard.id];
  const rootIsLinkedBoard = !!String(rootBoardPage?.type).match('linked');

  const linkedSourceId = activeView?.fields.linkedSourceId;

  const activeSourceType = rootBoard?.fields.sourceType ?? activeView?.fields.sourceType;

  const [sourceType, setSourceType] = useState<DataSourceType | undefined>(
    activeSourceType === 'google_form' ? 'google_form' : rootIsLinkedBoard ? 'board_page' : undefined
  );
  const [formStep, setStep] = useState<FormStep>(
    (rootIsLinkedBoard && views.length > 0) || activeSourceType === 'google_form' ? 'configure_source' : 'select_source'
  );

  const isCreatingProposals = useRef(false);

  const allowedSourceOptions: SourceOptions[] = [];

  if (rootIsLinkedBoard && activeSourceType !== 'google_form' && props.views.length > 0) {
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
    (_url, { arg }: Readonly<{ arg: { pageId: string } }>) => charmClient.createProposalSource(arg)
  );

  const typeformPopup = usePopupState({ variant: 'popover', popupId: 'typeformPopup' });

  async function handleApiKeyClick(type: ApiPageKey['type']) {
    if (rootDatabaseId) {
      await createWebhookApiKey({ pageId: rootDatabaseId, type });
      typeformPopup.open();
    }
  }

  async function handleProposalSource() {
    if (rootDatabaseId) {
      await onCreateDatabase?.({ sourceType: 'proposals' });
      await createProposalSource({ pageId: rootDatabaseId });
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
              <SourceType active={activeSourceType === 'board_page'} onClick={selectSourceType('board_page')}>
                <TbDatabase style={{ fontSize: 24 }} />
                CharmVerse database
              </SourceType>
            )}

            {allowedSourceOptions.includes('proposals') && (
              <SourceType
                data-test='source-proposals'
                active={activeSourceType === 'proposals'}
                onClick={
                  isLoadingProposalSource
                    ? undefined
                    : () => {
                        if (!isCreatingProposals.current) {
                          isCreatingProposals.current = true;
                          selectSourceType('proposals');
                          handleProposalSource();
                        }
                      }
                }
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
          onCreateDatabase?.({ sourceType: 'board_page' });
          typeformPopup.close();
        }}
      />
    </>
  );
}
