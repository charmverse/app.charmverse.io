import styled from '@emotion/styled';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';

import Avatar from 'components/common/Avatar';
import AvatarWithIcons from 'components/common/AvatarWithIcons';
import NftAvatarGalleryPopup from 'components/profile/components/NftAvatarGallery/NftAvatarGalleryPopup';
import { AvatarEditMenu } from 'components/settings/workspace/AvatarEditMenu';
import { useS3UploadInput } from 'hooks/useS3UploadInput';
import type { NftData } from 'lib/blockchain/interfaces';
import type { SupportedChainId } from 'lib/blockchain/provider/alchemy';
import type { UserAvatar } from 'lib/users/interfaces';

const StyledBox = styled(Box)`
  display: inline-block;
`;

const StyledAvatarWithIcons = styled(AvatarWithIcons)`
  &:hover .edit-avatar-icon, .delete-avatar-icon {
    display: initial;
  }
`;

function StyledIconButton ({ children, ...props }: { children: ReactNode, key: string, onClick: (e: React.MouseEvent<HTMLElement>) => void }) {
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
};

const getIcons = (editIcon: ReactNode, deleteIcon: ReactNode, avatar: string | null | undefined) => {
  if (!avatar) {
    return [editIcon];
  }

  return [editIcon, deleteIcon];
};

export default function LargeAvatar (props: LargeAvatarProps) {
  const { name, image, updateAvatar, variant, editable, canSetNft, isSaving, updateImage, isNft } = props;
  const editIconRef = useRef(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);

  function onNftSelect (nft: NftData) {
    const userAvatar: UserAvatar = {
      avatar: nft.image,
      avatarContract: nft.contract,
      avatarTokenId: nft.tokenId,
      avatarChain: nft.chainId as SupportedChainId
    };

    updateAvatar?.(userAvatar);
  }

  function updateImageAvatar (url: string) {
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

  const { inputRef, openFilePicker, onFileChange } = useS3UploadInput(updateImageAvatar);

  function onEditClick (event: React.MouseEvent<HTMLElement>) {
    if (canSetNft) {
      setMenuAnchorEl(event.currentTarget);
    }
    else {
      openFilePicker();
    }
  }

  if (!editable) {
    return (
      <Avatar
        avatar={image}
        name={name}
        variant={variant}
        isNft={isNft}
        size='2xLarge'
      />
    );
  }

  const icons = getIcons(
    <StyledIconButton key='edit-avatar' onClick={onEditClick}>
      <EditIcon
        ref={editIconRef}
        fontSize='small'
      />
    </StyledIconButton>,
    <StyledIconButton key='delete-avatar' onClick={() => updateImageAvatar('')}>
      <DeleteIcon
        fontSize='small'
      />
    </StyledIconButton>,
    image
  );

  return (
    <StyledBox>
      <input
        type='file'
        hidden
        accept='image/*'
        ref={inputRef}
        onChange={onFileChange}
      />
      <StyledAvatarWithIcons
        avatar={image}
        name={name}
        variant={variant}
        icons={icons}
        isNft={isNft}
        size='2xLarge'
      />
      {canSetNft && (
        <>
          <AvatarEditMenu
            anchorEl={menuAnchorEl}
            onClose={() => setMenuAnchorEl(null)}
            onUploadClick={openFilePicker}
            onNftClick={() => setIsGalleryVisible(true)}
          />
          <NftAvatarGalleryPopup isVisible={isGalleryVisible} onClose={() => setIsGalleryVisible(false)} onSelect={onNftSelect} isSaving={isSaving} />
        </>
      )}
    </StyledBox>
  );
}
