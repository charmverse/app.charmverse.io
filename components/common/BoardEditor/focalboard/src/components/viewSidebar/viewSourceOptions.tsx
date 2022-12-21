import { Box, Card, Grid, Typography } from '@mui/material';
import { useState } from 'react';
import { RiGoogleFill } from 'react-icons/ri';
import { TbDatabase } from 'react-icons/tb';

import type { BoardView } from '../../blocks/boardView';
import { createBoardView } from '../../blocks/boardView';
import mutator from '../../mutator';
import { useAppDispatch } from '../../store/hooks';
import { updateView } from '../../store/views';
import { SourceOptions } from '../SourceSelection';

interface LayoutOptionsProps {
  view: BoardView;
}

type SourceType = 'existing_database' | 'google_form';

type FormStep = 'select_source' | 'configure_source';

export function ViewSourceOptions(props: LayoutOptionsProps) {
  const activeView = props.view;

  const dispatch = useAppDispatch();
  const [sourceType, setSourceType] = useState<SourceType | undefined>(activeView.fields.sourceType);
  const [formStep, setStep] = useState<FormStep>('select_source');

  function selectSourceType(_source: SourceType) {
    return () => {
      setSourceType(_source);
      setStep('configure_source');
    };
  }

  async function selectExistingDatabase({ boardId: sourceBoardId }: { boardId: string }) {
    const newView = createBoardView(activeView);
    newView.fields.sourceType = 'board_page';
    newView.fields.linkedSourceId = sourceBoardId;
    try {
      dispatch(updateView(newView));
      await mutator.updateBlock(newView, activeView, 'change view source');
    } catch {
      dispatch(updateView(activeView));
    }
  }

  return (
    <Box onClick={(e) => e.stopPropagation()}>
      {formStep === 'select_source' && (
        <Grid container spacing={1} px={1}>
          <LayoutOption active={sourceType === 'existing_database'} onClick={selectSourceType('existing_database')}>
            <TbDatabase style={{ fontSize: 24 }} />
            CharmVerse database
          </LayoutOption>
          <LayoutOption active={sourceType === 'google_form'} onClick={selectSourceType('google_form')}>
            <RiGoogleFill style={{ fontSize: 24 }} />
            Google Form
          </LayoutOption>
        </Grid>
      )}
      {formStep === 'configure_source' && sourceType === 'existing_database' && (
        <SourceOptions onSelectSource={selectExistingDatabase} />
      )}
      {formStep === 'configure_source' && sourceType === 'google_form' && <>connect google form!</>}
    </Box>
  );
}

function LayoutOption({
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
