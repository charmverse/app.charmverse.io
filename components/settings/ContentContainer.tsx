import styled from '@emotion/styled';

const Container = styled.div`
  width: 800px;
  max-width: 100%;
  margin: 0 auto 5px;
  padding: 0 ${({ theme }) => theme.spacing(3)};
`;

export default Container;
