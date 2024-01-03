import styled from '@emotion/styled';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { Fragment } from 'react';
import { v4 as uuid } from 'uuid';

import Avatar from 'components/common/Avatar';
import { Button } from 'components/common/Button';
import type { HumanizeConditionsContent, HumanizeCondition } from 'lib/tokenGates/humanizeConditions';
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
  const isOperator = condition.content.some((c) => c.type === 'operator');
  const isExternalImage = !!condition.image?.startsWith('http');
  const imageFittingType = isExternalImage ? 'cover' : 'contain!important';
  const contractType = condition.standardContractType || '';

  return (
    <Box display='flex' alignItems='center' my={isOperator ? 2 : undefined}>
      {image && (
        <Box mr={2}>
          <Avatar
            size='large'
            avatar={image}
            sx={{
              img: {
                objectFit: imageFittingType
              }
            }}
            name='Token Gate condition'
            isNft={['POAP', 'ERC721', 'ERC1155'].includes(contractType) && isExternalImage}
          />
        </Box>
      )}
      <Box width='100%'>{textConditions.map(generateComponent).filter(isTruthy)}</Box>
      {onDelete && condition.content.some((c) => c.type !== 'operator') && (
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
  isLoading,
  onDelete
}: {
  conditions: HumanizeCondition[];
  isLoading?: boolean;
  onDelete?: (index: number) => void;
}) {
  return (
    <Box>
      {conditions.map((condition, i) => (
        <Condition
          key={uuid()}
          condition={condition}
          onDelete={onDelete ? () => onDelete?.(i) : undefined}
          isLoading={isLoading}
        />
      ))}
    </Box>
  );
}
