import styled from '@emotion/styled';
import { yupResolver } from '@hookform/resolvers/yup';
import RefreshIcon from '@mui/icons-material/Refresh';
import { IconButton, Tooltip, InputAdornment, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import type { Prisma, Space } from '@prisma/client';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { DialogTitle } from 'components/common/Modal';
import PrimaryButton from 'components/common/PrimaryButton';
import Avatar from 'components/settings/workspace/LargeAvatar';
import { useUser } from 'hooks/useUser';
import log from 'lib/log';
import { getSpaceDomainFromName } from 'lib/spaces/utils';
import { domainSchema } from 'lib/spaces/validateDomainName';
import randomName from 'lib/utilities/randomName';
import { greyColor2 } from 'theme/colors';

const ButtonContent = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  justify-content: center;
  width: 100%;
`;

const ImageIcon = styled.img`
  width: 1.5rem;
  height: 1.5rem;
`;

type TemplateOptionProps = {
  option: string;
  iconUrl?: string;
  isSelected?: boolean;
  onSelect: (option: string | null) => void;
};

function TemplateOption({ option, iconUrl, isSelected, onSelect }: TemplateOptionProps) {
  return (
    <Button
      color='secondary'
      variant='outlined'
      sx={{
        width: '100%'
      }}
      fullWidth
      size='large'
    >
      <ButtonContent>
        <Checkbox onClick={() => onSelect(option)} checked={isSelected} sx={{ left: '0px' }} />
        {option}
      </ButtonContent>
    </Button>
  );
}

export function SelectNewSpaceTemplate() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  return (
    <Grid container spacing={2} flexDirection='column'>
      <Grid item>
        <DialogTitle>Create a space</DialogTitle>
        <Typography variant='caption'>A space is where your organization collaborates</Typography>
        <Divider />
      </Grid>
      <Grid item>
        <TemplateOption
          onSelect={() => setSelectedTemplate(null)}
          option='Create my own'
          isSelected={selectedTemplate === null}
        />
      </Grid>
      {importOptions.map((opt) => (
        <Grid item key='opt'>
          <TemplateOption onSelect={setSelectedTemplate} option={opt} isSelected={selectedTemplate === opt} />
        </Grid>
      ))}
    </Grid>
  );
}
