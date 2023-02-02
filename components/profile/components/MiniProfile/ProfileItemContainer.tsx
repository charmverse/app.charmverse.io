import styled from '@emotion/styled';
import { Box } from '@mui/system';

export const ProfileItemContainer = styled(Box)`
  position: relative;

  &:hover .icons {
    opacity: 1;
    transition: opacity 150ms ease-in-out;
  }

  & .icons {
    position: absolute;
    opacity: 0;
    z-index: 1;
    right: -10px;
    top: -5px;
    cursor: pointer;
    transition: opacity 150ms ease-in-out;
  }
`;
