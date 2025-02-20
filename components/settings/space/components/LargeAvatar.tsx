import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditIcon from '@mui/icons-material/Edit';
import { Box, IconButton } from '@mui/material';
import { ResizeType } from '@packages/utils/constants';
import type { ReactNode } from 'react';
import { useState } from 'react';

import Avatar from 'components/common/Avatar';
import AvatarWithIcons from 'components/common/AvatarWithIcons';
import { NftAvatarGalleryPopup } from 'components/members/components/MemberProfile/components/ProfileWidgets/components/CollectionWidget/NftAvatarGallery/NftAvatarGalleryPopup';
import { AvatarEditMenu } from 'components/settings/space/components/AvatarEditMenu';
import { useS3UploadInput } from 'hooks/useS3UploadInput';
import type { NFTData } from 'lib/blockchain/getNFTs';
import type { SupportedChainId } from 'lib/blockchain/provider/alchemy/config';
import type { UserAvatar } from 'lib/users/interfaces';

import { ProgressOverlay } from './ProgressOverlay';

const StyledBox = styled(Box)`
  display: inline-block;
`;

const StyledAvatarWithIcons = styled(AvatarWithIcons)`
  &:hover .edit-avatar-icon,
  .delete-avatar-icon {
    display: initial;
  }
`;

function StyledIconButton({
  children,
  ...props
}: {
  children: ReactNode;
  key: string;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  return (
    <IconButton
      sx={{
        bgcolor: 'background.dark',
        '&:hover': { bgcolor: 'background.light' }
      }}
      size='small'
      {...props}
    >
      {children}
    </IconButton>
  );
}

type LargeAvatarProps = {
  name: string;
  image?: string | null | undefined;
  updateAvatar?: (avatar: UserAvatar) => void;
  updateImage?: (url: string) => void;
  variant?: 'circular' | 'rounded' | 'square';
  editable?: boolean;
  canSetNft?: boolean;
  isSaving?: boolean;
  isNft?: boolean;
  alwaysShowEdit?: boolean;
  hideDelete?: boolean;
  accept?: string;
};

export default function LargeAvatar(props: LargeAvatarProps) {
  const {
    hideDelete = false,
    name,
    image,
    updateAvatar,
    variant,
    editable,
    canSetNft,
    isSaving,
    updateImage,
    isNft,
    accept = 'image/*'
  } = props;
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);

  function onNftSelect(nft: NFTData) {
    const userAvatar: UserAvatar = {
      avatar: nft.image,
      avatarContract: nft.contract,
      avatarTokenId: nft.tokenId,
      avatarChain: nft.chainId as SupportedChainId
    };

    updateAvatar?.(userAvatar);
  }

  function updateImageAvatar({ url }: { url: string }) {
    if (updateImage) {
      updateImage(url);
      return;
    }

    const userAvatar: UserAvatar = {
      avatar: url,
      avatarContract: null,
      avatarTokenId: null,
      avatarChain: null
    };

    updateAvatar?.(userAvatar);
  }

  const { inputRef, isUploading, openFilePicker, onFileChange } = useS3UploadInput({
    onFileUpload: updateImageAvatar,
    resizeType: ResizeType.Artwork
  });

  function onEditClick(event: React.MouseEvent<HTMLElement>) {
    if (canSetNft) {
      setMenuAnchorEl(event.currentTarget);
    } else {
      openFilePicker();
    }
  }

  if (!editable) {
    return (
      <StyledBox>
        <Avatar avatar={image} name={name} variant={variant} isNft={isNft} size='2xLarge' />
      </StyledBox>
    );
  }

  return (
    <StyledBox>
      <ProgressOverlay isLoading={isSaving || isUploading}>
        <input type='file' hidden accept={accept} ref={inputRef} onChange={onFileChange} />
        <StyledAvatarWithIcons
          alwaysShow={props.alwaysShowEdit}
          avatar={image}
          name={name}
          variant={variant}
          icons={
            <>
              <StyledIconButton key='edit-avatar' onClick={onEditClick}>
                <EditIcon fontSize='small' />
              </StyledIconButton>
              {image && !hideDelete && (
                <StyledIconButton key='delete-avatar' onClick={() => updateImageAvatar({ url: '' })}>
                  <DeleteOutlinedIcon fontSize='small' />
                </StyledIconButton>
              )}
            </>
          }
          isNft={isNft}
          size='2xLarge'
        />
      </ProgressOverlay>
      {canSetNft && (
        <>
          <AvatarEditMenu
            anchorEl={menuAnchorEl}
            onClose={() => setMenuAnchorEl(null)}
            onUploadClick={openFilePicker}
            onNftClick={() => setIsGalleryVisible(true)}
          />
          <NftAvatarGalleryPopup
            isVisible={isGalleryVisible}
            onClose={() => setIsGalleryVisible(false)}
            onSelect={onNftSelect}
            isSaving={isSaving}
          />
        </>
      )}
    </StyledBox>
  );
}
