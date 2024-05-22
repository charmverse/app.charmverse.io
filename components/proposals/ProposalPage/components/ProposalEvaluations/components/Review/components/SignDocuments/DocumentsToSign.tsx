import type { DocumentSigner } from '@charmverse/core/prisma';
import { CardContent, Stack, Typography } from '@mui/material';
import Card from '@mui/material/Card';

import type { DocumentWithSigners } from 'lib/proposals/documentsToSign/getProposalDocumentsToSign';

export function DocumentSignerRow({ signer }: { signer: DocumentSigner }) {
  return (
    <div>
      {signer.name} - {signer.email}
    </div>
  );
}

export function DocumentRow({
  documentWithSigners,
  onRemoveDoc
}: {
  documentWithSigners: DocumentWithSigners;
  onRemoveDoc: VoidFunction;
}) {
  return (
    <Stack>
      <Typography variant='h6'>{documentWithSigners.title}</Typography>
      <Typography variant='body2' color='textSecondary'>
        Some notes about the document
        <div onClick={onRemoveDoc}>REMOVE DOC</div>
      </Typography>
      {documentWithSigners.signers.map((signer) => (
        <DocumentSignerRow key={signer.id} signer={signer} />
      ))}
    </Stack>
  );
}
