import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Box, Stack, Typography } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';

const StyledStack = styled(Stack)`
  background: ${({ theme }) => theme.palette.background.paper};
  flex-direction: row;
  align-items: center;
  z-index: 1;
  margin-bottom: 6.5px;
`;

const StyledItem = styled(Box)`
  border-left: 1px solid ${({ theme }) => theme.palette.divider};
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  padding: ${({ theme }) => theme.spacing(0.5, 1)};
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s ease-in-out;

  &:hover {
    background: ${({ theme }) => theme.palette.action.hover};
    transition: background 0.2s ease-in-out;
  }

  &:first-child {
    border-radius: 4px 0 0 4px;
  }

  &:last-child {
    border-right: 1px solid ${({ theme }) => theme.palette.divider};
    border-radius: 0 4px 4px 0;
  }
`;

export function ViewHeaderRowsMenu({
  checkedIds,
  setCheckedIds
}: {
  setCheckedIds: Dispatch<SetStateAction<string[]>>;
  checkedIds: string[];
}) {
  return (
    <StyledStack>
      <StyledItem>
        <Typography onClick={() => setCheckedIds([])} color='primary' variant='body2'>
          {checkedIds.length} selected
        </Typography>
      </StyledItem>
      <StyledItem>
        <DeleteOutlinedIcon fontSize='small' />
      </StyledItem>
    </StyledStack>
  );
}
