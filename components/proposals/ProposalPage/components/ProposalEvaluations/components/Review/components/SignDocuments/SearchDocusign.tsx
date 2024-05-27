import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { FormLabel, Grid, ListItemIcon, ListItemText, Menu, MenuItem, TextField } from '@mui/material';

import { useDocusign } from 'components/signing/hooks/useDocusign';
import type { DocusignEnvelope } from 'lib/docusign/api';

function DocusignSearchResult({ onClick, title }: { onClick: () => void; title: string }) {
  return (
    <MenuItem onClick={onClick}>
      <ListItemIcon>
        <DescriptionOutlinedIcon />
      </ListItemIcon>
      <ListItemText sx={{ textWrap: 'wrap' }}>{title}</ListItemText>
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

  return (
    <Grid container gap={2}>
      <Grid item>
        <FormLabel>Search documents to add</FormLabel>
        <TextField
          variant='outlined'
          fullWidth
          placeholder='Enter document title in Docusign'
          onChange={(ev) => searchDocusign({ proposalId, title: ev.target.value })}
        />
      </Grid>

      <Grid item gap={1}>
        {options?.map((e) => (
          <DocusignSearchResult
            key={e.envelopeId}
            title={e.emailSubject}
            onClick={() => onSelectEnvelope({ envelope: e })}
          />
        ))}
      </Grid>
    </Grid>
  );
}
