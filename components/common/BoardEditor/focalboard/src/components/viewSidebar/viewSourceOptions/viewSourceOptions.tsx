import type { ApiPageKey } from '@charmverse/core/prisma';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Box, Grid, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { BsFiletypeCsv } from 'react-icons/bs';
import { RiGoogleFill } from 'react-icons/ri';
import { SiTypeform } from 'react-icons/si';
import { TbDatabase } from 'react-icons/tb';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import ConfirmApiPageKeyModal from 'components/common/Modal/ConfirmApiPageKeyModal';
import { webhookEndpoint } from 'config/constants';
import type { BoardView, ViewSourceType } from 'lib/focalboard/boardView';

import { SidebarHeader } from '../viewSidebar';

import type { DatabaseSourceProps } from './components/CharmVerseDatabases';
import { CharmVerseDatabasesSource } from './components/CharmVerseDatabases';
import { GoogleFormsSource } from './components/GoogleForms/GoogleFormsSource';
import { SourceType } from './components/viewSourceType';

type FormStep = 'select_source' | 'configure_source';

type ViewSourceOptionsProps = DatabaseSourceProps & {
  closeSidebar?: () => void;
  onCsvImport?: (event: ChangeEvent<HTMLInputElement>) => void;
  goBack?: () => void;
  title?: string;
  view?: BoardView;
  pageId?: string;
};

export function ViewSourceOptions(props: ViewSourceOptionsProps) {
  const { view: activeView, pageId, title, onCreate, onSelect, onCsvImport, goBack, closeSidebar } = props;

  const activeSourceType = activeView?.fields.sourceType;

  const [sourceType, setSourceType] = useState<ViewSourceType | undefined>();
  const [formStep, setStep] = useState<FormStep>('select_source');

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
    `/api/pages/${pageId}/proposal-source`,
    (_url, { arg }: Readonly<{ arg: { pageId: string } }>) => charmClient.createProposalSource(arg)
  );

  const typeformPopup = usePopupState({ variant: 'popover', popupId: 'typeformPopup' });

  async function handleApiKeyClick(type: ApiPageKey['type']) {
    if (pageId) {
      await createWebhookApiKey({ pageId, type });
      typeformPopup.open();
    }
  }

  async function handleProposalSource() {
    if (pageId && onCreate) {
      await onCreate?.();
      await createProposalSource({ pageId });
    }
  }

  function selectSourceType(_source: ViewSourceType) {
    return () => {
      setSourceType(_source);
      setStep('configure_source');
    };
  }

  function goToFirstStep() {
    setStep('select_source');
  }

  return (
    <>
      <SidebarHeader
        goBack={formStep === 'select_source' ? goBack : goToFirstStep}
        title={title}
        closeSidebar={closeSidebar}
      />
      <Box onClick={(e) => e.stopPropagation()}>
        {formStep === 'select_source' && (
          <Grid container spacing={1} px={1}>
            <SourceType active={activeSourceType === 'board_page'} onClick={selectSourceType('board_page')}>
              <TbDatabase style={{ fontSize: 24 }} />
              CharmVerse database
            </SourceType>
            <SourceType
              active={activeSourceType === 'proposals'}
              onClick={
                isLoadingProposalSource
                  ? undefined
                  : () => {
                      selectSourceType('proposals');
                      handleProposalSource();
                    }
              }
            >
              <TaskOutlinedIcon fontSize='small' />
              Charmverse Proposals
            </SourceType>
            <SourceType active={false} component='label' htmlFor='dbcsvfile'>
              <input hidden type='file' id='dbcsvfile' name='dbcsvfile' accept='.csv' onChange={onCsvImport} />
              <BsFiletypeCsv style={{ fontSize: 24 }} />
              Import CSV
            </SourceType>
            <SourceType active={activeSourceType === 'google_form'} onClick={selectSourceType('google_form')}>
              <RiGoogleFill style={{ fontSize: 24 }} />
              Google Form
            </SourceType>
            <SourceType
              active={false}
              onClick={() => (isLoadingWebhookApiKeyCreation ? {} : handleApiKeyClick('typeform'))}
            >
              <SiTypeform style={{ fontSize: 24 }} />
              Typeform
            </SourceType>
            {onCreate && (
              <SourceType data-test='source-new-database' onClick={onCreate}>
                <AddCircleIcon style={{ fontSize: 24 }} />
                New database
              </SourceType>
            )}
          </Grid>
        )}
        {formStep === 'configure_source' && sourceType === 'board_page' && (
          <CharmVerseDatabasesSource
            onSelect={onSelect}
            activePageId={activeView?.fields.linkedSourceId}
            onCreate={onCreate}
          />
        )}
        {formStep === 'configure_source' && sourceType === 'google_form' && (
          <GoogleFormsSource
            activeFormId={activeView?.fields.sourceData?.formId}
            activeCredential={activeView?.fields.sourceData?.credentialId}
            onSelect={onSelect}
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
          onCreate?.();
          typeformPopup.close();
        }}
      />
    </>
  );
}
