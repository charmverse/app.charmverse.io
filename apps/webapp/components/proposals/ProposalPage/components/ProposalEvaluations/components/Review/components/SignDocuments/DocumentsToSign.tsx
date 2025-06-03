import type { DocumentSigner } from '@charmverse/core/prisma';
import { Check as CheckIcon } from '@mui/icons-material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { Box, Grid, Stack, Tooltip, Typography } from '@mui/material';
import type { DocumentWithSigners } from '@packages/lib/proposals/documentsToSign/getProposalDocumentsToSign';
import { getFormattedDateTime } from '@packages/lib/utils/dates';
import { lowerCaseEqual } from '@packages/utils/strings';
import { useRouter } from 'next/router';

import { Button } from 'components/common/Button';
import IconButton from 'components/common/DatabaseEditor/widgets/buttons/iconButton';
import { useDocusign } from 'components/signing/hooks/useDocusign';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

export function DocumentSignerRow({ signer, envelopeId }: { signer: DocumentSigner; envelopeId: string }) {
  const { user } = useUser();
  const { space } = useCurrentSpace();
  const router = useRouter();

  const userIsSigner =
    user?.verifiedEmails.some((verifiedEmail) => lowerCaseEqual(verifiedEmail.email, signer.email)) ||
    user?.googleAccounts.some((googleAccount) => lowerCaseEqual(googleAccount.email, signer.email));

  return (
    <Grid container>
      <Grid size={8}>
        <Typography>{signer.name}</Typography>
        <Typography variant='caption'>{signer.email}</Typography>
      </Grid>
      <Grid size={4} display='flex' flexDirection='row' justifyContent='flex-end' alignItems='center'>
        {signer.completedAt && (
          <Tooltip title={`Signature time: ${getFormattedDateTime(signer.completedAt)}`}>
            <Typography variant='caption' display='flex' alignItems='center'>
              Signed <CheckIcon sx={{ ml: 1 }} color='success' />
            </Typography>
          </Tooltip>
        )}

        {!signer.completedAt && (
          <Typography variant='caption'>{userIsSigner ? 'Check your email' : 'Awaiting signature'}</Typography>
        )}
      </Grid>
    </Grid>
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
    <Stack gap={1}>
      <Box display='flex' width='100%' justifyContent='space-between' alignItems='flex-start'>
        <Typography variant='body1' fontWeight='bold'>
          {documentWithSigners.title}
        </Typography>

        {onRemoveDoc && (
          <Tooltip title='Remove this document from the list of documents to sign'>
            <IconButton
              onClick={onRemoveDoc}
              icon={<DeleteOutlineOutlinedIcon sx={{ mt: 0.2 }} fontSize='small' color='error' />}
            />
          </Tooltip>
        )}
      </Box>
      {documentWithSigners.signers.map((signer) => (
        <DocumentSignerRow key={signer.id} signer={signer} envelopeId={documentWithSigners.docusignEnvelopeId} />
      ))}
    </Stack>
  );
}
