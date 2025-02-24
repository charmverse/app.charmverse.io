import { Box, Button, TextField, Typography } from '@mui/material';
import { isUrl } from '@packages/utils/strings';
import { useState } from 'react';

type InputProps = {
  placeholder: string;
  helperText?: string;
  isValid?: (url: string) => boolean;
  onSubmit: (url: string) => void;
  multiline?: boolean;
  initialValue?: string;
};

export function MediaUrlInput(props: InputProps) {
  const [embedUrl, setEmbedUrl] = useState(props.initialValue ?? '');

  return (
    <Box display='flex' flexDirection='column' gap={2} alignItems='center'>
      <TextField
        autoFocus
        multiline={props.multiline}
        maxRows={3}
        placeholder={props.placeholder}
        sx={{ width: 400, maxWidth: '100%' }}
        value={embedUrl}
        onChange={(e) => setEmbedUrl(e.target.value)}
      />
      <Button
        disabled={props.isValid ? !props.isValid(ensureProtocol(embedUrl)) : !isUrl(ensureProtocol(embedUrl))}
        sx={{
          width: 250
        }}
        onClick={() => {
          props.onSubmit(ensureProtocol(embedUrl.trim()));
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
  if (userInput.includes('http')) {
    return userInput;
  }
  return `https://${userInput}`;
}
