import { styled } from '@mui/material';

export const IframeContainer = styled('div')`
  line-height: 0; // hide margin that appears underneath
  object-fit: contain;
  width: 100%;
  height: 100%;
  user-select: none;
  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    &:hover {
      cursor: initial;
    }
  }
  border-radius: ${({ theme }) => theme.spacing(1)};
`;
