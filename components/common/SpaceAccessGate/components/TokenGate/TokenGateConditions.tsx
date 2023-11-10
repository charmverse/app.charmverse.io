import styled from '@emotion/styled';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { Fragment } from 'react';
import { v4 as uuid } from 'uuid';

import { Button } from 'components/common/Button';
import type { HumanizeConditionsContent, HumanizeConditionsData } from 'lib/tokenGates/humanizeConditions';
import { isTruthy } from 'lib/utilities/types';

const StyledOperator = styled(Box)`
  &:after,
  &:before {
    content: ' ';
    width: 100%;
    height: 2px;
    display: flex;
    background-color: ${({ theme }) => theme.palette.background.light};
  }
`;

function generateComponent(condition: HumanizeConditionsContent) {
  const { content, url, props } = condition;

  switch (condition.type) {
    case 'operator':
      return (
        <StyledOperator key={content} display='flex' alignItems='center'>
          <Typography {...props} px={1}>
            {content.toUpperCase()}{' '}
          </Typography>
        </StyledOperator>
      );
    case 'text':
      return (
        <Typography key={content} {...props} component='span'>
          {content}{' '}
        </Typography>
      );
    case 'link':
      return (
        <Fragment key={content}>
          <Button
            size='small'
            href={url}
            variant='text'
            external
            noPadding
            target='_blank'
            color='inherit'
            sx={{ p: 0, fontWeight: 'bold', fontSize: 'inherit', '&:hover': { background: 'none' } }}
          >
            {content}
          </Button>{' '}
        </Fragment>
      );
    default:
      return null;
  }
}

function Condition({ conditions }: { conditions: HumanizeConditionsContent[] }) {
  const image = conditions.find((c) => c.type === 'image') || null;
  const textConditions = conditions.filter((c) => c.type !== 'image');
  const isOperator = textConditions.some((c) => c.type === 'operator');
  const isExternalImage = image?.url?.startsWith('http');
  const imageFittingType = isExternalImage ? 'cover' : undefined;
  const imageBorderRadius = isExternalImage ? '50%' : undefined;

  return (
    <Box display='flex' alignItems='center' my={isOperator ? 2 : undefined}>
      {image?.url && (
        <Box mr={2}>
          <Image
            src={image.url}
            width={35}
            height={35}
            style={{
              display: 'block',
              borderRadius: imageBorderRadius,
              objectFit: imageFittingType,
              ...image.props?.style
            }}
            alt={image.content}
          />
        </Box>
      )}
      <Box width='100%'>{textConditions.map(generateComponent).filter(isTruthy)}</Box>
    </Box>
  );
}

export function ConditionsGroup({ conditions }: { conditions: HumanizeConditionsData }) {
  return (
    <Box>
      {conditions.map((condition) => (
        <Condition key={uuid()} conditions={condition} />
      ))}
    </Box>
  );
}
