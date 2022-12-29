import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import { Card, Grid, Box, ListItemIcon, MenuItem, Typography } from '@mui/material';
import { useState } from 'react';
import { RiGoogleFill } from 'react-icons/ri';
import { TbDatabase } from 'react-icons/tb';

import PagesList from 'components/common/CharmEditor/components/PageList';
import { usePages } from 'hooks/usePages';
import type { BoardView, ViewSourceType } from 'lib/focalboard/boardView';
import { isTruthy } from 'lib/utilities/types';

import { GoogleForms } from './googleDataSources';
import { SidebarHeader } from './viewSidebar';

type FormStep = 'select_source' | 'configure_source';

export type Props = {
  onCreate?: () => void;
  onSelect: (page: { id: string }) => void;
};

type SourceTypesProps = Props & {
  closeSidebar: () => void;
  goBack?: () => void;
  title: string;
  view?: BoardView;
};

const SidebarContent = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  border-bottom: 1px solid rgb(var(--center-channel-color-rgb), 0.12);
`;

export function ViewSourceOptions(props: SourceTypesProps) {
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
          </Grid>
        )}
        {formStep === 'configure_source' && sourceType === 'board_page' && (
          <CharmVerseDatabases
            onSelect={props.onSelect}
            activePageId={activeView?.fields.linkedSourceId}
            onCreate={props.onCreate}
          />
        )}
        {formStep === 'configure_source' && sourceType === 'google_form' && <GoogleForms />}
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
          height: '100%',
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

function CharmVerseDatabases(props: Props & { activePageId?: string }) {
  const { pages } = usePages();
  const boardPages = Object.values(pages)
    .filter((p) => p?.type === 'board' || p?.type === 'inline_board')
    .filter(isTruthy);
  return (
    <>
      <SidebarContent>
        <PagesList pages={boardPages} activePageId={props.activePageId} onSelectPage={(page) => props.onSelect(page)} />
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
