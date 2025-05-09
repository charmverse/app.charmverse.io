import styled from '@emotion/styled';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { isTruthy } from '@packages/utils/types';
import { Fragment } from 'react';
import { v4 as uuid } from 'uuid';

import Avatar from 'components/common/Avatar';
import { Button } from 'components/common/Button';
import type { HumanizeConditionsContent, HumanizeCondition } from '@packages/lib/tokenGates/humanizeConditions';
import type { Operator } from '@packages/lib/tokenGates/interfaces';

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

function Condition({
  condition,
  isLoading,
  onDelete
}: {
  condition: HumanizeCondition;
  isLoading?: boolean;
  onDelete?: VoidFunction;
}) {
  const image = condition.image;
  const textConditions = condition.content;
  const text = textConditions.map(generateComponent).filter(isTruthy);
  const isExternalImage = !!condition.image?.startsWith('http');
  const imageFittingType = isExternalImage ? 'cover' : 'contain!important';
  const contractType = condition.type || '';

  return (
    <Box display='flex' alignItems='center'>
      {typeof image === 'string' && (
        <Box mr={2}>
          <Avatar
            size='large'
            avatar={image}
            sx={{
              img: {
                objectFit: imageFittingType
              },
              backgroundColor: 'initial'
            }}
            name='Token Gate condition'
            isNft={['POAP', 'ERC721', 'ERC1155'].includes(contractType) && isExternalImage}
          />
        </Box>
      )}
      <Box width='100%' display='flex' alignItems='center' gap={0.5}>
        {text}
      </Box>
      {onDelete && (
        <Box>
          <IconButton onClick={onDelete} disabled={isLoading} color='default'>
            <DeleteIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}

export function ConditionsGroup({
  conditions,
  operator = 'OR',
  isLoading,
  onDelete
}: {
  conditions: HumanizeCondition[];
  operator?: Operator;
  isLoading?: boolean;
  onDelete?: (index: number) => void;
}) {
  return (
    <Box>
      {conditions.map((condition, i, arr) => (
        <>
          <Condition
            key={uuid()}
            condition={condition}
            onDelete={onDelete ? () => onDelete?.(i) : undefined}
            isLoading={isLoading}
          />
          {arr.length !== i + 1 && (
            <StyledOperator display='flex' alignItems='center' my={2}>
              <Typography px={1}>{operator} </Typography>
            </StyledOperator>
          )}
        </>
      ))}
    </Box>
  );
}
