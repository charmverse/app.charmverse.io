import styled from '@emotion/styled';

const StyledRoot = styled.div`
  position: relative;
  z-index: var(--z-index-modal);
`;

export default function RootPortal() {
  return <StyledRoot id='focalboard-root-portal' className='focalboard-body'></StyledRoot>;
}
