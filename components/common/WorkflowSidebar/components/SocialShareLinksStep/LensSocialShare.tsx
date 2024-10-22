import { Box, Tooltip } from '@mui/material';
import { isProdEnv } from '@root/config/constants';
import { useState } from 'react';

import { OpenWalletSelectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/OpenWalletSelectorButton';
import { Button } from 'components/common/Button';
import { InlineCharmEditor } from 'components/common/CharmEditor';
import type { ICharmEditorOutput } from 'components/common/CharmEditor/InlineCharmEditor';
import Link from 'components/common/Link';
import Modal from 'components/common/Modal';
import { useLensProfile } from 'components/settings/account/hooks/useLensProfile';
import { useCreateLensPublication } from 'hooks/useCreateLensPublication';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { checkIsContentEmpty } from 'lib/prosemirror/checkIsContentEmpty';
import { emptyDocument } from 'lib/prosemirror/constants';
import type { PageContent } from 'lib/prosemirror/interfaces';

export function LensSocialShare({
  lensPostLink,
  canPublishToLens,
  onPublish,
  link,
  content,
  pageId
}: {
  canPublishToLens: boolean;
  onPublish?: VoidFunction;
  link: string;
  content: PageContent;
  lensPostLink?: string | null;
  pageId: string;
}) {
  const { hasFarcasterProfile } = useLensProfile();
  const [isPublishToLensModalOpen, setIsPublishToLensModalOpen] = useState(false);
  const { account, chainId, signer } = useWeb3Account();

  const { createLensPublication, isPublishingToLens } = useCreateLensPublication({
    publicationType: 'post',
    onError: () => {
      setIsPublishToLensModalOpen(false);
    },
    onSuccess: () => {
      onPublish?.();
      setIsPublishToLensModalOpen(false);
    },
    pageId,
    link
  });

  const [lensContent, setLensContent] = useState<ICharmEditorOutput>({
    doc: content,
    rawText: ''
  });

  const imageStyleProps = {
    borderRadius: '50%',
    width: 35,
    height: 35,
    cursor: lensPostLink || hasFarcasterProfile ? 'pointer' : 'default'
  };

  return (
    <>
      <Tooltip
        title={
          lensPostLink
            ? 'View on lens'
            : hasFarcasterProfile
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
                if (hasFarcasterProfile && canPublishToLens) {
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
          {!account || !chainId || !signer ? (
            <Tooltip title='Your wallet must be unlocked to pay for this reward'>
              <OpenWalletSelectorButton label='Unlock Wallet' />
            </Tooltip>
          ) : (
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
          )}
        </Box>
      </Modal>
    </>
  );
}
