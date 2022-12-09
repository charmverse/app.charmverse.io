import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import { useEffect, useState } from 'react';

export type ErrorInfo = {
  title: string;
  description: string;
};

type Props<ErrorType> = {
  error?: ErrorType;
  processError: (error: ErrorType) => ErrorInfo;
};

// tailing comma for generics to sidestep the JSX ambiguity
export default function Error<ErrorType>({ error, processError }: Props<ErrorType>) {
  const [state, setState] = useState<ErrorInfo>({ title: '', description: '' });

  // delay the open of the Collapse from when the error has changed,
  // so it fetches the content height correctly
  const [delayedShow, setDelayedShow] = useState(!!error);

  useEffect(() => {
    if (!error) {
      setDelayedShow(false);
      return;
    }

    setTimeout(() => setDelayedShow(true), 100);

    const newState = processError(error);
    setState(newState);
  }, [error, processError]);

  return (
    <Collapse in={delayedShow}>
      <Alert severity='error' sx={{ mb: 3 }}>
        <Box>
          <AlertTitle>{state.title}</AlertTitle>
          {state.description}
        </Box>
      </Alert>
    </Collapse>
  );
}
