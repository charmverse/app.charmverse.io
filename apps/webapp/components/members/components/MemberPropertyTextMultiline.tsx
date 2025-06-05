import { styled } from '@mui/material';
import { Stack, Typography } from '@mui/material';
import { useState } from 'react';

const MAX_CHAR = 150;

const ReadMoreTypography = styled(Typography)`
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

export function MemberPropertyTextMultiline({ label, value }: { value?: string; label?: string }) {
  const [showingFullValue, setShowingFullValue] = useState(false);

  const textContent = value ?? 'N/A';
  const isOverflowing = textContent.length > MAX_CHAR;

  return (
    <Stack>
      {label && (
        <Typography fontWeight='bold' variant='subtitle2'>
          {label}
        </Typography>
      )}
      <Typography whiteSpace='normal' variant='body2'>
        {!showingFullValue && isOverflowing ? `${textContent.slice(0, MAX_CHAR)}...` : textContent}
        {isOverflowing && (
          <ReadMoreTypography
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowingFullValue(!showingFullValue);
            }}
            variant='body2'
            fontWeight='bold'
          >
            {!showingFullValue ? 'Read more' : 'Read less'}
          </ReadMoreTypography>
        )}
      </Typography>
    </Stack>
  );
}
