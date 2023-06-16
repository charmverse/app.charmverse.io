import { useTheme } from '@emotion/react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Link from 'components/common/Link';
import Modal from 'components/common/Modal';

export function BlocksExplanation() {
  const theme = useTheme();

  return (
    <Stack gap={2}>
      <Box>
        <Typography variant='h6'></Typography>
        <Typography variant='body2'>
          Every piece of content in CharmVerse is a block:
          <ul>
            <li>Paragraphs, images, videos, and embeds are all individual blocks</li>
            <li>Forum posts, comments, proposals, and bounties may be comprised of multiple blocks.</li>
            <li>Each row or card in a database is a block and may contain multiple blocks in the body.</li>
            <li>Each cell of a table may contain more than one block.</li>
          </ul>
        </Typography>
      </Box>
      <Box>
        <Typography variant='h6' sx={{ mb: 2 }}>
          How many blocks does my community need?
        </Typography>
        <Typography variant='body2'>
          Based on your community's size, here are some suggested block needs:
          <br />
          <br />
          <b>10,000 to 20,000 blocks:</b>
          <br />
          A few contributors getting a community off the ground
          <br />
          <br />
          <b>50,000 to 100,000 blocks:</b>
          <br />
          10 core contributors serving a 100-200 person community
        </Typography>
      </Box>
      <Box>
        <Link
          sx={{ ...theme.typography.caption }}
          external
          href='https://app.charmverse.io/charmverse/page-5371612014886058'
          target='_blank'
        >
          Find out more about pricing
        </Link>
      </Box>
    </Stack>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export function BlocksExplanationModal({ onClose, open }: Props) {
  return (
    <Modal open={open} onClose={onClose} size='large' title='What is a block?'>
      <BlocksExplanation />
    </Modal>
  );
}
