import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import Grid from '@mui/material/Grid';

import Button from 'components/common/Button';
import type { SpaceCreateTemplate } from 'lib/spaces/utils';
import { spaceContentTemplates, spaceCreateTemplates } from 'lib/spaces/utils';
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

const templates = typedKeys(spaceContentTemplates);

export function SelectNewSpaceTemplate({ onSelect, selectedTemplate }: SelectNewSpaceTemplateProps) {
  return (
    <Grid container spacing={2} flexDirection='column'>
      <Grid item>
        <TemplateOption onSelect={onSelect} option='default' currentSelection={selectedTemplate} />
      </Grid>
      <Grid item>
        <Typography textAlign='center' fontWeight='bold'>
          Start from a template
        </Typography>
      </Grid>

      {templates.map((template) => (
        <Grid item key={template}>
          <TemplateOption onSelect={onSelect} option={template} currentSelection={selectedTemplate} />
        </Grid>
      ))}

      <Grid item>
        <TemplateOption onSelect={onSelect} option='importNotion' currentSelection={selectedTemplate} />
      </Grid>

      <Grid item>
        <TemplateOption onSelect={onSelect} option='importMarkdown' currentSelection={selectedTemplate} />
      </Grid>
    </Grid>
  );
}
