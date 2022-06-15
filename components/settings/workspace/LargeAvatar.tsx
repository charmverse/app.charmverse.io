import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { useRef, ReactNode } from 'react';
import Avatar from 'components/common/Avatar';
import AvatarWithIcons from 'components/common/AvatarWithIcons';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { uploadToS3 } from 'lib/aws/uploadToS3Browser';

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

function StyledIconButton ({ children, ...props }: { children: ReactNode, key: string, onClick: () => void }) {
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
  updateImage?: (url: string) => void;
  variant?: 'circular' | 'rounded' | 'square';
  editable?: boolean;
};

const getIcons = (editIcon: ReactNode, deleteIcon: ReactNode, avatar: string | null | undefined) => {
  if (!avatar) {
    return [editIcon];
  }

  return [editIcon, deleteIcon];
};

export default function LargeAvatar (props: LargeAvatarProps) {
  const { name, image, updateImage, variant, editable } = props;
  const inputFile = useRef<HTMLInputElement>(null);
  const icons = getIcons(
    <StyledIconButton key='edit-avatar' onClick={() => inputFile && inputFile.current && inputFile.current.click()}>
      <EditIcon
        fontSize='small'
      />
    </StyledIconButton>,
    <StyledIconButton key='delete-avatar' onClick={() => updateImage && updateImage('')}>
      <DeleteIcon
        onClick={() => updateImage && updateImage('')}
        fontSize='small'
      />
    </StyledIconButton>,
    image
  );

  return (
    editable
      ? (
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

              if (updateImage) {
                updateImage(url);
              }

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
          />
        </StyledBox>
      ) : (
        <StyledAvatar
          avatar={image}
          name={name}
          variant={variant}
        />
      )
  );
}
