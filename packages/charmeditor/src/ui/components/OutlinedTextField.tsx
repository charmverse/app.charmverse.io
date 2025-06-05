import { styled } from '@mui/material';

// this component can be used to replicate the appearance of an MUI TextFIeld
// Check the element with class .MuiOutlinedInput-root for reference
export const OutlinedTextField = styled('div', {
  shouldForwardProp: (prop) => prop !== 'error' && prop !== 'rows'
})<{ error?: boolean; rows?: number }>`
  font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
  font-weight: 400;
  font-size: 1rem;
  letter-spacing: 0.00938em;
  line-height: 1.4375em;
  padding: 8.5px 14px;
  border-radius: var(--charm-shape-borderRadius);
  background: var(--charm-palette-inputBackground-main);
  color: var(--charm-palette-text-primary);
  border: 1px solid var(--input-border);
  ${({ error }) => (error ? 'border-color: var(--charm-palette-error-main);' : '')}
  ${({ rows }) => (rows ? `min-height: ${2 * rows}em;` : '')}

  &:hover {
    border-color: var(--charm-palette-text-primary);
  }

  &:focus {
    border-color: var(--charm-palette-primary-main);
    outline: 1px solid var(--charm-palette-primary-main);
  }
`;
