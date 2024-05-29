import CloseIcon from '@mui/icons-material/Close';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { Chip, Divider, FormLabel, Grid, ListItemIcon, ListItemText, MenuItem, Stack, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import { useState } from 'react';

import IconButton from 'components/common/DatabaseEditor/widgets/buttons/iconButton';
import { Typography } from 'components/common/Typography';
import { useDocusign } from 'components/signing/hooks/useDocusign';
import type { DocusignEnvelope } from 'lib/docusign/api';

function DocusignSearchResult({
  onClick,
  title,
  signerEmails
}: {
  onClick: () => void;
  title: string;
  signerEmails: string[];
}) {
  return (
    <MenuItem onClick={onClick}>
      <Stack gap={1}>
        <Box display='flex'>
          <ListItemIcon>
            <DescriptionOutlinedIcon />
          </ListItemIcon>
          <ListItemText sx={{ textWrap: 'wrap' }}>{title}</ListItemText>
        </Box>
        <Box display='flex' gap={1} flexWrap='wrap'>
          {signerEmails.map((email) => (
            <Chip size='small' key={email} label={email} />
          ))}
        </Box>
      </Stack>
    </MenuItem>
  );
}

type Props = {
  onSelectEnvelope: (input: { envelope: DocusignEnvelope }) => void;
  selectedEnvelopeIds?: string[];
  proposalId: string;
};

export function SearchDocusign({ onSelectEnvelope, selectedEnvelopeIds, proposalId }: Props) {
  const { searchDocusign, envelopeSearchResults } = useDocusign();

  const options = envelopeSearchResults?.filter((e) => !selectedEnvelopeIds?.includes(e.envelopeId));

  const [showSearch, setShowSearch] = useState(false);

  function selectEnvelope({ envelope }: { envelope: DocusignEnvelope }) {
    onSelectEnvelope({ envelope });
    setShowSearch(false);
  }

  if (!showSearch) {
    return (
      <Box onClick={() => setShowSearch(true)} display='flex' alignItems='center'>
        <IconButton icon={<DescriptionOutlinedIcon fontSize='small' />} />
        <Typography>Add document</Typography>
      </Box>
    );
  }

  return (
    <Grid container gap={2}>
      <Grid item width='100%'>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <FormLabel>Search documents to add</FormLabel>
          <IconButton icon={<CloseIcon fontSize='small' />} onClick={() => setShowSearch(false)} />
        </Box>
        <TextField
          variant='outlined'
          fullWidth
          placeholder='Enter document title in Docusign'
          onChange={(ev) => searchDocusign({ proposalId, title: ev.target.value })}
        />
      </Grid>

      <Grid item gap={1} width='100%'>
        {options?.map((e) => (
          <>
            <DocusignSearchResult
              key={e.envelopeId}
              title={e.emailSubject}
              signerEmails={e.recipients.signers.filter((s) => s.email !== e.sender.email).map((s) => s.email)}
              onClick={() => selectEnvelope({ envelope: e })}
            />
            <Divider sx={{ height: '2px' }} />
          </>
        ))}
      </Grid>
    </Grid>
  );
}
