import CloseIcon from '@mui/icons-material/Close';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import {
  Alert,
  Chip,
  Divider,
  FormLabel,
  Grid,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  TextField
} from '@mui/material';
import Box from '@mui/material/Box';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import IconButton from 'components/common/DatabaseEditor/widgets/buttons/iconButton';
import { useDocusign } from 'components/signing/hooks/useDocusign';
import type { DocusignEnvelope, DocusignEnvelopeLite } from '@packages/lib/docusign/api';

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
  onSelectEnvelope: (input: { envelope: DocusignEnvelopeLite }) => void;
  selectedEnvelopeIds?: string[];
  proposalId: string;
};

export function SearchDocusign({ onSelectEnvelope, selectedEnvelopeIds, proposalId }: Props) {
  const { searchDocusign, envelopeSearchResults, envelopeSearchError } = useDocusign();

  const options = envelopeSearchResults?.filter((e) => !selectedEnvelopeIds?.includes(e.envelopeId));

  const [showSearch, setShowSearch] = useState(false);

  function selectEnvelope({ envelope }: { envelope: DocusignEnvelopeLite }) {
    onSelectEnvelope({ envelope });
    setShowSearch(false);
  }

  if (!showSearch) {
    return (
      <Box onClick={() => setShowSearch(true)} display='flex' alignItems='center'>
        <Button color='primary' fontSize='small' startIcon={<DescriptionOutlinedIcon fontSize='small' />}>
          Add document
        </Button>
      </Box>
    );
  }

  return (
    <Grid container gap={2}>
      <Grid item xs={12}>
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
      {envelopeSearchError && (
        <Grid item xs={12}>
          <Alert sx={{ width: '100%' }} severity='error'>
            {envelopeSearchError.message}
          </Alert>
        </Grid>
      )}

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
