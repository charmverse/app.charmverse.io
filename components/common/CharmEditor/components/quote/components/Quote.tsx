import styled from '@emotion/styled';

const StyledBlockQuote = styled.div`
  border-left: 4px solid ${({ theme }) => theme.palette.text.primary};
  font-size: 20px;
  padding-left: ${({ theme }) => theme.spacing(2)};
  padding-top: ${({ theme }) => theme.spacing(1.2)};
  padding-bottom: ${({ theme }) => theme.spacing(1.2)};
  margin-top: ${({ theme }) => theme.spacing(1)};
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
`;

export default StyledBlockQuote;
