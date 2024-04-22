import LinkIcon from '@mui/icons-material/Link';
import { IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useCopyToClipboard } from 'usehooks-ts';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { LensSocialShare } from './LensSocialShare';
import { SocialShareLink } from './SocialShareLink';

export function SocialShareLinksStep({
  onPublish,
  lensPostLink,
  link,
  text,
  readOnly,
  content
}: {
  readOnly?: boolean;
  onPublish: VoidFunction;
  link: string;
  text: string;
  lensPostLink?: string | null;
  content: PageContent;
}) {
  const isAdmin = useIsAdmin();
  const { showMessage } = useSnackbar();
  const [, copyFn] = useCopyToClipboard();

  function copyProposalLink() {
    copyFn(link).then(() => {
      showMessage('Copied proposal link');
    });
  }

  const isDisabled = !isAdmin || readOnly;

  return (
    <Stack gap={1} flexDirection='row' alignItems='center' p={1}>
      <Typography variant='h6' mr={1}>
        Share
      </Typography>
      <SocialShareLink site='x' link={link} text={text} />
      <SocialShareLink site='warpcast' link={link} text={text} />
      <LensSocialShare
        onPublish={onPublish}
        lensPostLink={lensPostLink}
        content={content}
        link={link}
        canPublishToLens={!isDisabled}
      />
      <SocialShareLink site='telegram' link={link} text={text} />
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
