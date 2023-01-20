import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import { useState } from 'react';

import Button from 'components/common/Button';
import { DialogTitle } from 'components/common/Modal';
import type { SpaceCreateTemplate } from 'lib/spaces/utils';
import { spaceCreateTemplates } from 'lib/spaces/utils';

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
  option: string;
  isSelected: boolean;
  onSelect: () => void;
};

function TemplateOption({ option, onSelect, isSelected }: TemplateOptionProps) {
  return (
    <Button
      onClick={onSelect}
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
      <ButtonContent>{option}</ButtonContent>
    </Button>
  );
}

type SelectNewSpaceTemplateProps = {
  onSelect: (option: SpaceCreateTemplate) => void;
  selectedTemplate?: SpaceCreateTemplate;
};

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
        <TemplateOption onSelect={() => onSelect(null)} option='Create my own' isSelected={selectedTemplate === null} />
      </Grid>
      <Grid item>
        <Typography textAlign='center' variant='body2'>
          Start from a template
        </Typography>
      </Grid>
      {spaceCreateTemplates.map((opt) => (
        <Grid item key='opt'>
          <TemplateOption onSelect={() => onSelect(opt)} option={opt} isSelected={selectedTemplate === opt} />
        </Grid>
      ))}
    </Grid>
  );
}
