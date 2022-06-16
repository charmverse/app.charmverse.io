import styled from '@emotion/styled';
import { Alert, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';

const StyledAlert = styled(Alert)`
    position: absolute;
    margin: auto;
    left: 0;
    right: 0;
    max-width: 590px;
    width: 100%;
    z-index: 2000;

    & > .MuiAlert-icon {
        padding-top: 8px;
    }
`;

type RefreshPageAlertProps = {
    clear: () => void;
    content: string;
};

function RefreshPageAlert (props: RefreshPageAlertProps) {
  const { clear, content } = props;

  return (
    <StyledAlert
      severity='warning'
      action={(
        [
          <IconButton onClick={() => window.location.reload()}>
            <RefreshIcon fontSize='small' />
          </IconButton>,
          <IconButton onClick={() => clear()}>
            <ClearIcon fontSize='small' />
          </IconButton>
        ]
    )}
    >
      <Typography>{ content }</Typography>
    </StyledAlert>
  );
}

export default RefreshPageAlert;
