import { Box, Tooltip } from '@mui/material';
import { useState } from 'react';

import { useProposal } from 'components/[pageId]/DocumentPage/hooks/useProposal';
import { Button } from 'components/common/Button';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import InlineCharmEditor from 'components/common/CharmEditor/InlineCharmEditor';
import Link from 'components/common/Link';
import Modal from 'components/common/Modal';
import { useLensProfile } from 'components/settings/account/hooks/useLensProfile';
import { isProdEnv } from 'config/constants';
import { useCreateLensPublication } from 'hooks/useCreateLensPublication';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import { emptyDocument } from 'lib/prosemirror/constants';

export function ProposalLensSocialShare({
  proposalLink,
  proposalTitle,
  proposalId,
  lensPostLink,
  canPublishToLens
}: {
  canPublishToLens: boolean;
  proposalTitle: string;
  proposalLink: string;
  proposalId: string;
  lensPostLink?: string | null;
}) {
  const { lensProfile } = useLensProfile();
  const [isPublishToLensModalOpen, setIsPublishToLensModalOpen] = useState(false);
  const { space } = useCurrentSpace();
  const { refreshProposal } = useProposal({
    proposalId
  });

  const { createLensPublication, isPublishingToLens } = useCreateLensPublication({
    publicationType: 'post',
    onError: () => {
      setIsPublishToLensModalOpen(false);
    },
    onSuccess: () => {
      refreshProposal();
      setIsPublishToLensModalOpen(false);
    },
    proposalId,
    proposalLink
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
                    href: proposalLink
                  }
                }
              ],
              text: proposalLink
            }
          ]
        }
      ]
    },
    rawText: ''
  });

  const imageStyleProps = {
    borderRadius: '50%',
    width: 35,
    height: 35,
    cursor: lensPostLink || lensProfile ? 'pointer' : 'default'
  };

  return (
    <>
      <Tooltip
        title={
          lensPostLink
            ? 'View on lens'
            : lensProfile
            ? canPublishToLens
              ? 'Publish to Lens'
              : 'You do not have permission to publish to Lens'
            : 'Please create a Lens profile first'
        }
      >
        <div style={{ display: 'flex' }}>
          {lensPostLink ? (
            <Link
              style={{
                display: 'flex'
              }}
              href={`https://${!isProdEnv ? 'testnet.' : ''}hey.xyz/posts/${lensPostLink}`}
              target='_blank'
              rel='noopener noreferrer'
            >
              <img src='/images/logos/lens_logo.png' style={imageStyleProps} />
            </Link>
          ) : (
            <img
              onClick={() => {
                if (lensProfile && canPublishToLens) {
                  setIsPublishToLensModalOpen(true);
                }
              }}
              src='/images/logos/lens_logo.png'
              style={imageStyleProps}
            />
          )}
        </div>
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
          key={`${isPublishingToLens}`}
          readOnly={isPublishingToLens}
        />
        <Box
          sx={{
            mt: 1,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <Button
            onClick={() => {
              createLensPublication({
                content: lensContent.doc
              });
            }}
            loading={isPublishingToLens}
            disabled={checkIsContentEmpty(lensContent.doc)}
            primary
          >
            Share
          </Button>
        </Box>
      </Modal>
    </>
  );
}
