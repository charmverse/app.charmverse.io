import { styled } from '@mui/material';
import { Box } from '@mui/material';

const StyledPageTemplateBanner = styled(Box)`
  top: 55px;
  width: '100%';
  z-index: var(--z-index-appBar);
  display: flex;
  justify-content: center;
  color: ${({ theme }) => theme.palette.templateBanner.text};
  background-color: ${({ theme }) => theme.palette.templateBanner.background};
  padding: ${({ theme }) => theme.spacing(1.4)};
`;

export function DraftPostBanner() {
  return (
    <StyledPageTemplateBanner>
      <Box>
        <span>You're viewing a draft post</span>
      </Box>
    </StyledPageTemplateBanner>
  );
}
