import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid';

import Button from 'components/common/Button';
import { DialogTitle } from 'components/common/Modal';
import { useFilePicker } from 'hooks/useFilePicker';
import type { SpaceCreateTemplate } from 'lib/spaces/utils';
import { spaceCreateTemplates } from 'lib/spaces/utils';
import { typedKeys } from 'lib/utilities/objects';

const ButtonContent = styled.div`
  display: block;
  text-align: center;
  width: 100%;
`;

const ImageIcon = styled.img`
  width: 1.5rem;
  height: 1.5rem;
`;

type TemplateOptionProps = {
  option: SpaceCreateTemplate;
  currentSelection: SpaceCreateTemplate;
  onSelect: (option: SpaceCreateTemplate) => void;
};

function TemplateOption({ option, onSelect, currentSelection }: TemplateOptionProps) {
  const isSelected = option === currentSelection;

  return (
    <Button
      onClick={() => onSelect(option)}
      color={isSelected ? 'primary' : 'secondary'}
      variant='outlined'
      sx={{
        width: '100%',
        justifyContent: 'space-between',
        display: 'flex'
      }}
      fullWidth
      size='large'
    >
      <ButtonContent>{spaceCreateTemplates[option]}</ButtonContent>
    </Button>
  );
}

type SelectNewSpaceTemplateProps = {
  onSelect: (option: SpaceCreateTemplate) => void;
  selectedTemplate: SpaceCreateTemplate;
};

export function SelectNewSpaceTemplate({ onSelect, selectedTemplate }: SelectNewSpaceTemplateProps) {
  return (
    <Grid container spacing={2} flexDirection='column'>
      <Grid item>
        <Typography textAlign='center' variant='body2'>
          A space is where your organization collaborates
        </Typography>
      </Grid>
      <Grid item>
        <TemplateOption onSelect={onSelect} option='default' currentSelection={selectedTemplate} />
      </Grid>
      <Grid item>
        <Typography textAlign='center' variant='body2'>
          Start from a template
        </Typography>
      </Grid>

      <Grid item>
        <TemplateOption onSelect={onSelect} option='templateNftCommunity' currentSelection={selectedTemplate} />
      </Grid>

      <Grid item>
        <TemplateOption onSelect={onSelect} option='importNotion' currentSelection={selectedTemplate} />
      </Grid>

      <Grid item>
        <TemplateOption onSelect={onSelect} option='importMarkdown' currentSelection={selectedTemplate} />
      </Grid>
    </Grid>
  );
}
