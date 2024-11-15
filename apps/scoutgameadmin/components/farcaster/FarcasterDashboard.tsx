'use client';

import { Add as AddIcon, Clear as ClearIcon } from '@mui/icons-material';
import {
  CircularProgress,
  Container,
  InputAdornment,
  Link,
  Avatar,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Box,
  IconButton,
  Typography,
  TableSortLabel
} from '@mui/material';
import React, { useState, useMemo } from 'react';

import { useSearchUsers } from 'hooks/api/users';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import type { SortField, SortOrder } from 'lib/users/getUsers';

export function FarcasterDashboard() {
  return (
    <Container maxWidth='xl'>
      <Stack direction='row' spacing={2} justifyContent='space-between' alignItems='center' mb={2}>
        <Box>text</Box>
      </Stack>
    </Container>
  );
}
