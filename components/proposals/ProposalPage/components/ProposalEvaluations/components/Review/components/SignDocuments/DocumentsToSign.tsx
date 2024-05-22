import type { DocumentSigner } from '@charmverse/core/prisma';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Box, CardContent, Stack, Tooltip, Typography } from '@mui/material';
import Card from '@mui/material/Card';

import type { DocumentWithSigners } from 'lib/proposals/documentsToSign/getProposalDocumentsToSign';

export function DocumentSignerRow({ signer }: { signer: DocumentSigner }) {
  return (
    <Tooltip title={signer.email}>
      <Typography>{signer.name}</Typography>
    </Tooltip>
  );
}

export function DocumentRow({
  documentWithSigners,
  onRemoveDoc
}: {
  documentWithSigners: DocumentWithSigners;
  onRemoveDoc?: VoidFunction;
}) {
  return (
    <Stack gap={2}>
      <Box display='flex' width='100%' justifyContent='space-between'>
        <Typography variant='body1' fontWeight='bold'>
          {documentWithSigners.title}
        </Typography>

        {onRemoveDoc && <DeleteOutlineOutlinedIcon onClick={onRemoveDoc} />}
      </Box>
      {documentWithSigners.signers.map((signer) => (
        <DocumentSignerRow key={signer.id} signer={signer} />
      ))}
    </Stack>
  );
}
