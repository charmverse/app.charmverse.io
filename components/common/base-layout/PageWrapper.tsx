import styled from '@emotion/styled';

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background-color: ${({ theme }) => theme.palette.background.light};
`;

export default PageWrapper;
