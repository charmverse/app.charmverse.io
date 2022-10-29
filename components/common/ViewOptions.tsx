import styled from '@emotion/styled';

export const StyledViewOptions = styled.div`
  align-items: center;
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  .MuiInputLabel-root, .MuiSelect-select {
    font-size: .85em;
  }
`;
