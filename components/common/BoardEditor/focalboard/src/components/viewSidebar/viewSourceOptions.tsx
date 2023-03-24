import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import { Box, Card, Grid, ListItemIcon, MenuItem, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { RiGoogleFill } from 'react-icons/ri';
import { TbDatabase } from 'react-icons/tb';

import PagesList from 'components/common/CharmEditor/components/PageList';
import { usePages } from 'hooks/usePages';
import type { BoardView, BoardViewFields, ViewSourceType } from 'lib/focalboard/boardView';
import type { PageMeta } from 'lib/pages';
import { isTruthy } from 'lib/utilities/types';

import { GoogleDataSource } from './GoogleDataSource/GoogleDataSource';
import { SidebarHeader } from './viewSidebar';

type FormStep = 'select_source' | 'configure_source';

export type DatabaseSourceProps = {
  onCreate?: () => void;
  onSelect: (source: Pick<BoardViewFields, 'linkedSourceId' | 'sourceData' | 'sourceType'>) => void;
};

type ViewSourceOptionsProps = DatabaseSourceProps & {
  closeSidebar?: () => void;
  goBack?: () => void;
  title?: string;
  view?: BoardView;
};

const SidebarContent = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  border-bottom: 1px solid rgb(var(--center-channel-color-rgb), 0.12);
`;

export function ViewSourceOptions(props: ViewSourceOptionsProps) {
  const activeView = props.view;
  const activeSourceType = activeView?.fields.sourceType;

  const [sourceType, setSourceType] = useState<ViewSourceType | undefined>();
  const [formStep, setStep] = useState<FormStep>('select_source');

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
            <SourceType active={activeSourceType === 'google_form'} onClick={selectSourceType('google_form')}>
              <RiGoogleFill style={{ fontSize: 24 }} />
              Google Form
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
    </>
  );
}

function SourceType({
  active,
  onClick,
  children
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Grid item xs={6} onClick={onClick}>
      <Card
        variant='outlined'
        sx={{
          height: '80px',
          cursor: 'pointer',
          borderColor: active ? 'var(--primary-color)' : '',
          '&:hover': { bgcolor: !active ? 'sidebar.background' : '' }
        }}
      >
        <Typography align='center' height='100%' variant='body2' color={active ? 'primary' : 'secondary'}>
          <Box
            component='span'
            height='100%'
            display='flex'
            p={1}
            alignItems='center'
            flexDirection='column'
            justifyContent='center'
          >
            {children}
          </Box>
        </Typography>
      </Card>
    </Grid>
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

  function onSelect(page: PageMeta) {
    props.onSelect({
      linkedSourceId: page.id,
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
