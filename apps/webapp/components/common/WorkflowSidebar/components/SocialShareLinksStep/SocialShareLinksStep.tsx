import LinkIcon from '@mui/icons-material/Link';
import { IconButton, Stack, Tooltip, Typography } from '@mui/material';
import type { PageContent } from '@packages/charmeditor/interfaces';
import { useCopyToClipboard } from 'usehooks-ts';

import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';

import { SocialShareLink } from './SocialShareLink';

export function SocialShareLinksStep({
  onPublish,
  lensPostLink,
  link,
  text,
  readOnly,
  content,
  pageId
}: {
  readOnly?: boolean;
  onPublish?: VoidFunction;
  link: string;
  text: string;
  lensPostLink?: string | null;
  content: PageContent;
  pageId: string;
}) {
  const isAdmin = useIsAdmin();
  const { showMessage } = useSnackbar();
  const [, copyFn] = useCopyToClipboard();

  function copyProposalLink() {
    copyFn(link).then(() => {
      showMessage('Copied link');
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
      <SocialShareLink site='telegram' link={link} text={text} />
      <Tooltip title='Copy link'>
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
