import LinkIcon from '@mui/icons-material/Link';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';

import { Button } from 'components/common/Button';
import { InlineCharmEditor } from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import Modal from 'components/common/Modal';
import { useLensProfile } from 'components/settings/account/hooks/useLensProfile';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { emptyDocument } from 'lib/prosemirror/constants';
import { getPagePath } from 'lib/utilities/domains/getPagePath';

function ProposalLensSocialShare({ proposalPath, proposalTitle }: { proposalTitle: string; proposalPath: string }) {
  const { lensProfile } = useLensProfile();
  const [isPublishToLensModalOpen, setIsPublishToLensModalOpen] = useState(false);
  const { space } = useCurrentSpace();
  const pagePath = getPagePath({
    path: proposalPath,
    spaceDomain: space?.domain ?? '',
    hostName: window.location.hostname
  });

  const [lensContent, setLensContent] = useState<ICharmEditorOutput>({
    doc: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: [
                {
                  type: 'bold'
                }
              ],
              text: `Proposal: `
            },
            {
              type: 'text',
              text: `${proposalTitle || 'Untitled'} from ${space?.name} is now open for feedback.`
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: `View on CharmVerse `
            },
            {
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: `${window.location.host}${pagePath}`
                  }
                }
              ],
              text: `${window.location.host}${pagePath}`
            }
          ]
        }
      ]
    },
    rawText: ''
  });

  return (
    <>
      <Tooltip title={lensProfile ? 'Publish to Lens' : ''}>
        <img
          onClick={() => {
            if (lensProfile) {
              setIsPublishToLensModalOpen(true);
            }
          }}
          src='/images/logos/lens_logo.png'
          style={{
            borderRadius: '50%',
            width: 35,
            height: 35,
            cursor: lensProfile ? 'pointer' : 'default'
          }}
        />
      </Tooltip>
      <Modal
        open={isPublishToLensModalOpen}
        title='Publish to Lens'
        onClose={() => {
          setIsPublishToLensModalOpen(false);
        }}
      >
        <InlineCharmEditor
          onContentChange={setLensContent}
          content={lensContent.doc || emptyDocument}
          colorMode='dark'
          style={{
            minHeight: 100
          }}
        />
        <Box
          sx={{
            mt: 1,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <Button onClick={() => {}} primary>
            Share
          </Button>
        </Box>
      </Modal>
    </>
  );
}

export function ProposalSocialShare({ proposalPath, proposalTitle }: { proposalPath: string; proposalTitle: string }) {
  return (
    <Stack gap={1} flexDirection='row' alignItems='center'>
      <Typography variant='h6' mr={1}>
        Share
      </Typography>
      <ProposalLensSocialShare proposalPath={proposalPath} proposalTitle={proposalTitle} />
      <Box
        sx={{
          width: 35,
          height: 35,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backgroundColor: 'background.dark'
        }}
      >
        <LinkIcon />
      </Box>
    </Stack>
  );
}
