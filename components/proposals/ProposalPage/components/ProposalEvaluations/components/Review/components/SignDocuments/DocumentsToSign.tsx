import type { DocumentSigner } from '@charmverse/core/prisma';
import { CardContent, Typography } from '@mui/material';
import Card from '@mui/material/Card';

import type { ProposalDocumentWithEnvelope } from 'lib/proposals/getDocuments';

export function DocumentSignerRow({ signer }: { signer: DocumentSigner }) {
  return (
    <div>
      {signer.name} - {signer.email}
    </div>
  );
}

export function DocumentRow({ docToSign }: { docToSign: ProposalDocumentWithEnvelope }) {
  <Card>
    <CardContent>
      <Typography variant='h6'>{docToSign.envelope.emailSubject}</Typography>
      <Typography variant='body2' color='textSecondary'>
        Some notes about the document
      </Typography>
      <Typography variant='body2' color='textSecondary'>
        {docToSign.document.signers.map((signer) => (
          <DocumentSignerRow key={signer.id} signer={signer} />
        ))}
      </Typography>
    </CardContent>
  </Card>;
}
