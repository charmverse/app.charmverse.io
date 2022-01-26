import styled from '@emotion/styled';
import { lightGreyColor } from 'theme/colors';
import Avatar from './Avatar';

const StyledAvatar = styled(Avatar)<{ active: boolean }>`
  border-radius: 8px;
  border: 2px solid ${({ theme }) => theme.palette.sidebar.background};
  &:hover {
    box-shadow: 0 0 0 3px ${({ theme }) => theme.palette.sidebar.avatarHighlight};
  }
  ${({ active, theme }) => active && `box-shadow: 0 0 0 3px ${theme.palette.sidebar.avatarHighlight};`}
`;

export default function ({ active = false, name = '' }: { active?: boolean, name: string }) {
  return (
    <StyledAvatar active={active} name={name} variant='rounded' />
  );
}
