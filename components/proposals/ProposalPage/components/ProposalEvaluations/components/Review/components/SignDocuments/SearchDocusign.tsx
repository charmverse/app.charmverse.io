import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { Divider, FormLabel, Grid, TextField } from '@mui/material';
import Box from '@mui/material/Box';

import { useDocusign } from 'components/signing/hooks/useDocusign';
import type { DocusignEnvelope } from 'lib/docusign/api';

function DocusignSearchResult({ onClick, title }: { onClick: () => void; title: string }) {
  return (
    <Box onClick={onClick} display='flex'>
      <DescriptionOutlinedIcon /> {title}
    </Box>
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

  return (
    <Grid container gap={2}>
      <Grid item>
        <FormLabel>Search Docusign</FormLabel>
        <TextField
          variant='outlined'
          fullWidth
          placeholder='Enter document title'
          onChange={(ev) => searchDocusign({ proposalId, title: ev.target.value })}
        />
      </Grid>

      <Grid container item gap={1}>
        {options?.map((e) => (
          <Grid item key={e.envelopeId}>
            <DocusignSearchResult title={e.emailSubject} onClick={() => onSelectEnvelope({ envelope: e })} />
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
}
