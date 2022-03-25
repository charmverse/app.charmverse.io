import styled from '@emotion/styled';

const StyledRoot = styled.div`
  position: relative;
  z-index: 2500;
`;

export default function RootPortal () {
  return (
    <StyledRoot id='focalboard-root-portal' className='focalboard-body'></StyledRoot>
  );
}
