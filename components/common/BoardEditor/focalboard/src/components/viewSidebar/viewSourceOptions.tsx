import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import { Box, Grid, ListItemIcon, MenuItem, TextField, Typography } from '@mui/material';
import type { ApiPageKey } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';
import { BsFiletypeCsv } from 'react-icons/bs';
import { RiGoogleFill } from 'react-icons/ri';
import { SiTypeform } from 'react-icons/si';
import { TbDatabase } from 'react-icons/tb';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import PagesList from 'components/common/CharmEditor/components/PageList';
import ConfirmApiPageKeyModal from 'components/common/Modal/ConfirmApiPageKeyModal';
import { webhookBaseUrl } from 'config/constants';
import { useCurrentPage } from 'hooks/useCurrentPage';
import { usePages } from 'hooks/usePages';
import type { BoardView, BoardViewFields, ViewSourceType } from 'lib/focalboard/boardView';
import { isTruthy } from 'lib/utilities/types';

import { GoogleDataSource } from './GoogleDataSource/GoogleDataSource';
import { SidebarHeader } from './viewSidebar';
import { SourceType } from './viewSourceType';

type FormStep = 'select_source' | 'configure_source';

export type DatabaseSourceProps = {
  onCreate?: () => void;
  onSelect: (source: Pick<BoardViewFields, 'linkedSourceId' | 'sourceData' | 'sourceType'>) => void;
};

type ViewSourceOptionsProps = DatabaseSourceProps & {
  closeSidebar?: () => void;
  onCsvImport?: (event: ChangeEvent<HTMLInputElement>) => void;
  goBack?: () => void;
  title?: string;
  view?: BoardView;
  boardId?: string;
};

const SidebarContent = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  border-bottom: 1px solid rgb(var(--center-channel-color-rgb), 0.12);
`;

export function ViewSourceOptions(props: ViewSourceOptionsProps) {
  const activeView = props.view;
  const activeSourceType = activeView?.fields.sourceType;
  const { currentPageId } = useCurrentPage();

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

  const typeformPopup = usePopupState({ variant: 'popover', popupId: 'typeformPopup' });

  const handleApiKeyClick = async (type: ApiPageKey['type']) => {
    const boardId = props.boardId || currentPageId;
    if (boardId) {
      await createWebhookApiKey({ pageId: boardId, type });
      typeformPopup.open();
    }
  };

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
        goBack={formStep === 'select_source' ? props.goBack : goToFirstStep}
        title={props.title}
        closeSidebar={props.closeSidebar}
      />
      <Box onClick={(e) => e.stopPropagation()}>
        {formStep === 'select_source' && (
          <Grid container spacing={1} px={1}>
            <SourceType active={activeSourceType === 'board_page'} onClick={selectSourceType('board_page')}>
              <TbDatabase style={{ fontSize: 24 }} />
              CharmVerse database
            </SourceType>
            <SourceType active={false} component='label' htmlFor='dbcsvfile'>
              <input hidden type='file' id='dbcsvfile' name='dbcsvfile' accept='.csv' onChange={props.onCsvImport} />
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
            {props.onCreate && (
              <SourceType onClick={props.onCreate}>
                <AddCircleIcon style={{ fontSize: 24 }} />
                New database
              </SourceType>
            )}
          </Grid>
        )}
        {formStep === 'configure_source' && sourceType === 'board_page' && (
          <CharmVerseDatabases
            onSelect={props.onSelect}
            activePageId={activeView?.fields.linkedSourceId}
            onCreate={props.onCreate}
          />
        )}
        {formStep === 'configure_source' && sourceType === 'google_form' && (
          <GoogleDataSource
            activeFormId={activeView?.fields.sourceData?.formId}
            activeCredential={activeView?.fields.sourceData?.credentialId}
            onSelect={props.onSelect}
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
            <i>{`${webhookBaseUrl}/${webhookApi?.apiKey}`}</i>
          </Typography>
        }
        title='Typeform webhook'
        open={typeformPopup.isOpen}
        onClose={typeformPopup.close}
        onConfirm={() => {
          props.onCreate?.();
          typeformPopup.close();
        }}
      />
    </>
  );
}

function CharmVerseDatabases(props: DatabaseSourceProps & { activePageId?: string }) {
  const { pages } = usePages();
  const [searchTerm, setSearchTerm] = useState('');
  const sortedPages = useMemo(() => {
    return Object.values(pages)
      .filter(
        (p) =>
          (p?.type === 'board' || p?.type === 'inline_board') &&
          p.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(isTruthy)
      .sort((pageA, pageB) => ((pageA.title || 'Untitled') > (pageB.title || 'Untitled') ? 1 : -1));
  }, [pages, searchTerm]);

  function onSelect(pageId: string) {
    props.onSelect({
      linkedSourceId: pageId,
      sourceType: 'board_page'
    });
  }
  return (
    <>
      <SidebarContent>
        <TextField
          autoFocus
          placeholder='Search pages'
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
          sx={{
            mb: 1
          }}
          fullWidth
        />
        <PagesList
          emptyText='No databases found'
          pages={sortedPages}
          activePageId={props.activePageId}
          onSelectPage={onSelect}
          style={{
            height: '250px',
            overflow: 'auto'
          }}
        />
      </SidebarContent>
      {props.onCreate && (
        <MenuItem onClick={props.onCreate}>
          <ListItemIcon>
            <AddIcon color='secondary' />
          </ListItemIcon>
          <Typography variant='body2' color='secondary'>
            New database
          </Typography>
        </MenuItem>
      )}
    </>
  );
}
