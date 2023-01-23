import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid';

import Button from 'components/common/Button';
import { DialogTitle } from 'components/common/Modal';
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
  isSelected: boolean;
  onSelect: (option: SpaceCreateTemplate) => void;
};

function TemplateOption({ option, onSelect, isSelected }: TemplateOptionProps) {
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
  selectedTemplate?: SpaceCreateTemplate;
};

const createOptions = typedKeys(spaceCreateTemplates).filter((opt) => opt !== 'default');

export function SelectNewSpaceTemplate({ onSelect, selectedTemplate }: SelectNewSpaceTemplateProps) {
  return (
    <Grid container spacing={2} flexDirection='column'>
      <Grid item>
        <DialogTitle sx={{ textAlign: 'center', display: 'block' }}>Create a space</DialogTitle>
        <Typography textAlign='center' variant='body2'>
          A space is where your organization collaborates
        </Typography>
      </Grid>
      <Grid item>
        <TemplateOption onSelect={onSelect} option='default' isSelected={selectedTemplate === 'default'} />
      </Grid>
      <Grid item>
        <Typography textAlign='center' variant='body2'>
          Start from a template
        </Typography>
      </Grid>
      {createOptions.map((opt) => (
        <Grid item key='opt'>
          <TemplateOption onSelect={onSelect} option={opt} isSelected={selectedTemplate === opt} />
        </Grid>
      ))}
    </Grid>
  );
}
