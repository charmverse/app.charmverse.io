import styled from '@emotion/styled';
import Typography from '@mui/material/Typography';

const PageTitle = styled(Typography)<{ hasContent?: boolean }>`
  color: inherit;
  display: block;
  align-items: center;
  font-size: 14px;
  height: 24px;
  &:hover {
    color: inherit;
  }
  ${(props) => props.hasContent ? 'opacity: 0.5;' : ''}
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  width: calc(80%); // hack to get ellipsis to appear
`;

export default PageTitle;
