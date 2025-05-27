import { styled } from '@mui/material';
import Typography from '@mui/material/Typography';
import { memo } from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PageTitle = styled(({ hasContent, ...props }: any) => <Typography {...props} />)<{ hasContent?: boolean }>`
  color: inherit;
  display: block;
  align-items: center;
  font-size: 14px;
  height: 24px;
  line-height: 24px;
  &:hover {
    color: inherit;
  }
  ${(props) => (props.hasContent ? 'opacity: 0.5;' : '')}
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  width: calc(80%); // hack to get ellipsis to appear
  ${({ theme }) => `
  ${theme.breakpoints.down('md')} {
    font-size: 16px;
    line-height: 26px;
    height: 26px;
  }
`}
`;

export default memo(PageTitle);
