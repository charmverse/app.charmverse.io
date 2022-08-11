import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { useRef, ReactNode, useState } from 'react';
import Avatar from 'components/common/Avatar';
import AvatarWithIcons from 'components/common/AvatarWithIcons';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { uploadToS3 } from 'lib/aws/uploadToS3Browser';
import { AvatarEditMenu } from 'components/settings/workspace/AvatarEditMenu';
import { NftAvatarGallery } from 'components/profile/components/NftAvatarGallery/NftAvatarGallery';
import { NftData } from 'lib/nft/types';
import { UserAvatar } from 'lib/users/interfaces';

const StyledBox = styled(Box)`
  display: inline-block;
`;

const baseAvatarStyles = css`
  font-size: 90px;
  width: 150px;
  height: 150px;
`;

const StyledAvatar = styled(Avatar)`
  ${baseAvatarStyles}
  ${({ variant }) => variant === 'rounded' && 'border-radius: 25px'};
`;

const StyledAvatarWithIcons = styled(AvatarWithIcons)`
  ${baseAvatarStyles}
  ${({ variant }) => variant === 'rounded' && 'border-radius: 25px'};
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
  const inputFile = useRef<HTMLInputElement>(null);
  const editIconRef = useRef(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);

  const onUploadClick = () => {
    inputFile?.current?.click();
  };

  const onEditClick = (event: React.MouseEvent<HTMLElement>) => {
    if (canSetNft) {
      setMenuAnchorEl(event.currentTarget);
    }
    else {
      onUploadClick();
    }
  };

  const onNftSelect = (nft: NftData) => {
    const userAvatar: UserAvatar = {
      avatar: nft.image,
      avatarContract: nft.contract,
      avatarTokenId: nft.tokenId,
      avatarTokenChain: nft.chainId
    };

    updateAvatar?.(userAvatar);
  };

  const updateImageAvatar = (url: string) => {
    if (updateImage) {
      updateImage(url);
      return;
    }

    const userAvatar: UserAvatar = {
      avatar: url,
      avatarContract: null,
      avatarTokenId: null,
      avatarTokenChain: null
    };

    updateAvatar?.(userAvatar);
  };

  if (!editable) {
    return (
      <StyledAvatar
        avatar={image}
        name={name}
        variant={variant}
        isNft={isNft}
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
        ref={inputFile}
        onChange={async (e) => {
          const firstFile = e.target.files?.[0];
          if (!firstFile) {
            return;
          }

          const { url } = await uploadToS3(firstFile);

          updateImageAvatar(url);

          // This is a fix for when trying to select the same file again after
          // having removed it.
          e.target.value = '';
        }}
      />
      <StyledAvatarWithIcons
        avatar={image}
        name={name}
        variant={variant}
        icons={icons}
        isNft={isNft}
      />
      {canSetNft && (
      <>
        <AvatarEditMenu
          anchorEl={menuAnchorEl}
          onClose={() => setMenuAnchorEl(null)}
          onUploadClick={onUploadClick}
          onNftClick={() => setIsGalleryVisible(true)}
        />
        <NftAvatarGallery isVisible={isGalleryVisible} onClose={() => setIsGalleryVisible(false)} onSelect={onNftSelect} isSaving={isSaving} />
      </>
      )}
    </StyledBox>
  );
}
