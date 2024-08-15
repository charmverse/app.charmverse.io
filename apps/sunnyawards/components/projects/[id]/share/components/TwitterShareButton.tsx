'use client';

import styled from '@emotion/styled';
import { Button, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { BsTwitterX } from 'react-icons/bs';

const twitterColor = '#00aced';

const StyledButton = styled(Button)`
  gap: 4px;
  background-color: ${twitterColor};
  &:hover {
    background-color: ${twitterColor};
    color: white;
  }
  color: white;
  font-size: 22px;
  padding-bottom: 4px;
  padding-top: 4px;
` as typeof Button;

export function TwitterShareButton({ image, projectPath }: { image?: string; projectPath: string }) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    setUrl(`${window.location.origin}/p/${projectPath}`);
  }, [projectPath]);

  const href = encodeURI(
    `https://twitter.com/intent/tweet?text=I just registered for the Sunny Awards to be eligible for 540K OP!&url=${url}`
  );

  return (
    <StyledButton
      variant='contained'
      href={href}
      rel='noopener noreferrer'
      target='_blank'
      startIcon={<BsTwitterX style={{ fill: 'white', fontSize: 28 }} />}
    >
      Share on Twitter
    </StyledButton>
  );
}
