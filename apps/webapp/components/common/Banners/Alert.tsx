import { styled } from '@mui/material';
import Alert from '@mui/material/Alert';

export const AlertBanner = styled(Alert)`
  justify-content: center;
  width: 100%;
  z-index: var(--z-index-appBar);
  display: flex;
  position: sticky;
`;
