import styled from '@emotion/styled';
import { css } from '@emotion/react';
import { useState } from 'react';
import { AvatarWithIcons } from 'components/common/Avatar';
import Box from '@mui/material/Box';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const StyledBox = styled(Box)`
  display: inline-block;
`;

const iconStyle = css`
  position: absolute;
  top: 10px;
  cursor: pointer;
`;

const StyledEditIcon = styled(EditIcon)`
  ${iconStyle}
  right: 40px;
`;

const StyledDeleteIcon = styled(DeleteIcon)`
  ${iconStyle}
  right: 10px;
`;

const StyledAvatar = styled(AvatarWithIcons)`
  font-size: 90px;
  width: 150px;
  height: 150px;
  ${({ variant }) => variant === 'rounded' && 'border-radius: 25px'};

  &:hover .edit-avatar-icon, .delete-avatar-icon {
      display: initial;
    }
`;

type LargeAvatarProps = {
  name: string;
  variant?: 'circular' | 'rounded' | 'square';
};

export default function LargeAvatar (props: LargeAvatarProps) {
  const { name = '' } = props;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <StyledBox
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <StyledAvatar
        icons={
          isHovered && [
            <StyledEditIcon className='edit-avatar-icon' fontSize='medium' key='edit-avatar' />,
            <StyledDeleteIcon className='delete-avatar-icon' fontSize='medium' key='delete-avatar' />
          ]
        }
        {...props}
      >
        {name.charAt(0).toUpperCase()}
      </StyledAvatar>
    </StyledBox>
  );
}
