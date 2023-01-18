import { Box, Button, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import { isUrl } from 'lib/utilities/strings';

type InputProps = {
  placeholder: string;
  helperText?: string;
  isValid?: (url: string) => boolean;
  onSubmit: (url: string) => void;
};

export function MediaUrlInput(props: InputProps) {
  const [embedUrl, setEmbedUrl] = useState('');

  return (
    <Box display='flex' flexDirection='column' gap={2} alignItems='center'>
      <TextField
        autoFocus
        placeholder={props.placeholder}
        value={embedUrl}
        onChange={(e) => setEmbedUrl(e.target.value)}
      />
      <Button
        disabled={props.isValid ? !props.isValid(ensureProtocol(embedUrl)) : !isUrl(ensureProtocol(embedUrl))}
        sx={{
          width: 250
        }}
        onClick={() => {
          props.onSubmit(ensureProtocol(embedUrl));
          setEmbedUrl('');
        }}
      >
        Submit
      </Button>
      {props.helperText && (
        <Typography color='secondary' variant='caption'>
          {props.helperText}
        </Typography>
      )}
    </Box>
  );
}

// automatically add https:// to user input
function ensureProtocol(userInput: string) {
  if (userInput.startsWith('http')) {
    return userInput;
  }
  return `https://${userInput}`;
}
