import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { useRef, ReactNode } from 'react';
import Avatar from 'components/common/Avatar';
import AvatarWithIcons from 'components/common/AvatarWithIcons';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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
  ${({ variant }) => variant === 'rounded' && 'border-radius: 7x'};
`;

const StyledAvatarWithIcons = styled(AvatarWithIcons)`
  ${baseAvatarStyles}
  ${({ variant }) => variant === 'rounded' && 'border-radius: 25px'};

  &:hover .edit-avatar-icon, .delete-avatar-icon {
      display: initial;
    }
`;

type LargeAvatarProps = {
  name: string;
  spaceImage?: string | null | undefined;
  updateImage?: (url: string) => void;
  variant?: 'circular' | 'rounded' | 'square';
  displayIcons?: boolean;
};

const getIcons = (editIcon: ReactNode, deleteIcon: ReactNode, avatar: string | null | undefined) => {
  if (!avatar) {
    return [editIcon];
  }

  return [editIcon, deleteIcon];
};

export default function LargeAvatar (props: LargeAvatarProps) {
  const { name = '', spaceImage, updateImage, variant, displayIcons } = props;
  const inputFile = useRef<HTMLInputElement>(null);

  return (
    displayIcons
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
            avatar={spaceImage}
            icons={
              getIcons(
                <EditIcon
                  onClick={() => inputFile && inputFile.current && inputFile.current.click()}
                  fontSize='small'
                  key='edit-avatar'
                />,
                <DeleteIcon
                  onClick={() => updateImage && updateImage('')}
                  fontSize='small'
                  key='delete-avatar'
                />,
                spaceImage
              )
          }
            {...props}
          >
            {name.charAt(0).toUpperCase()}
          </StyledAvatarWithIcons>
        </StyledBox>
      ) : (
        <StyledAvatar
          avatar={spaceImage}
          name={name}
          variant={variant}
        >
          {name.charAt(0).toUpperCase()}
        </StyledAvatar>
      )
  );
}
