import LinkIcon from '@mui/icons-material/Link';
import { IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useCopyToClipboard } from 'usehooks-ts';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

import { ProposalLensSocialShare } from './ProposalLensSocialShare';
import { ProposalSocialShareLink } from './ProposalSocialShareLink';

export function ProposalSocialShareLinks({
  proposalId,
  proposalPath,
  proposalTitle,
  lensPostLink,
  proposalAuthors
}: {
  proposalAuthors: string[];
  proposalId: string;
  proposalPath: string;
  proposalTitle: string;
  lensPostLink?: string | null;
}) {
  const isAdmin = useIsAdmin();
  const { user } = useUser();
  const isProposalAuthor = user ? proposalAuthors.includes(user.id) : false;
  const { showMessage } = useSnackbar();
  const { space } = useCurrentSpace();
  const [, copyFn] = useCopyToClipboard();
  const proposalLink = `https://app.charmverse.io/${space?.domain}/${proposalPath}`;

  function copyProposalLink() {
    copyFn(proposalLink).then(() => {
      showMessage('Copied proposal link');
    });
  }

  const isDisabled = !(isAdmin || isProposalAuthor);

  return (
    <Stack gap={1} flexDirection='row' alignItems='center' p={1}>
      <Typography variant='h6' mr={1}>
        Share
      </Typography>
      <ProposalSocialShareLink site='x' proposalTitle={proposalTitle} proposalLink={proposalLink} />
      <ProposalSocialShareLink site='warpcast' proposalTitle={proposalTitle} proposalLink={proposalLink} />
      <ProposalLensSocialShare
        lensPostLink={lensPostLink}
        proposalId={proposalId}
        proposalLink={proposalLink}
        proposalTitle={proposalTitle}
        canPublishToLens={!isDisabled}
      />
      <ProposalSocialShareLink site='telegram' proposalTitle={proposalTitle} proposalLink={proposalLink} />
      <Tooltip title='Copy proposal link'>
        <IconButton
          sx={{
            width: 35,
            height: 35,
            borderRadius: '50%'
          }}
          onClick={copyProposalLink}
        >
          <LinkIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
