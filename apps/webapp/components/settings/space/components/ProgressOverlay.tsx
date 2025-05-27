import { styled } from '@mui/material';
import { CircularProgress } from '@mui/material';

const IconOverlay = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
  z-index: 1;
`;

const OverlayBackground = styled(IconOverlay)`
  background: var(--background-default);
  opacity: 0.3;
`;

const IconContainer = styled(IconOverlay)`
  background: var(--background-default);
  opacity: 0.3;
`;

function LoadingState() {
  return (
    <>
      <OverlayBackground />
      <IconContainer>
        <CircularProgress />
      </IconContainer>
    </>
  );
}

export function ProgressOverlay({ children, isLoading }: { children: React.ReactNode; isLoading?: boolean }) {
  return (
    <div style={{ position: 'relative' }}>
      {isLoading && <LoadingState />}
      {children}
    </div>
  );
}
