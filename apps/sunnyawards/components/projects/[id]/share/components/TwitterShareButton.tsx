'use client';

import styled from '@emotion/styled';
import { Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { BsTwitterX } from 'react-icons/bs';

const StyledButton = styled(Button)`
  color: white;
  &:hover {
    color: white;
  }
  font-size: 18px;
` as typeof Button;

export function TwitterShareButton({ projectPath }: { projectPath: string }) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    setUrl(`${window.location.origin}/p/${projectPath}`);
  }, [projectPath]);

  const href = encodeURI(
    `https://twitter.com/intent/tweet?text=I just registered for the Sunny Awards to be eligible for 540K OP!&url=${url}`
  );

  return (
    <StyledButton
      color='secondary'
      variant='outlined'
      size='large'
      href={href}
      rel='noopener noreferrer'
      target='_blank'
      startIcon={<BsTwitterX style={{ fill: 'white', fontSize: 24 }} />}
    >
      Share
    </StyledButton>
  );
}
