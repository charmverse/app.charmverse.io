import { Box, MenuItem, Select, Stack, Tooltip, Typography } from '@mui/material';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';

import type { StepperProps } from './Stepper';

export function MobileStepper({ value = '', steps, onClick }: StepperProps) {
  return (
    <Box
      width='100%'
      display={{
        xs: 'flex',
        md: 'none'
      }}
    >
      <Box width='100%' justifyContent='space-between' gap={2} alignItems='center' my='6px'>
        <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
          <PropertyLabel readOnly>Status</PropertyLabel>
          <Box display='flex' flex={1}>
            <Select
              fullWidth
              value={value}
              onChange={(e) => onClick(e.target.value as string)}
              renderValue={(v) => {
                const step = steps.find((s) => s.value === v);
                return <Typography>{step?.label}</Typography>;
              }}
            >
              {steps.map((step) => {
                return (
                  <MenuItem
                    key={step.value}
                    value={step.value}
                    disabled={step.disabled}
                    sx={{
                      p: 1
                    }}
                  >
                    <Stack>
                      <Typography>{step.label}</Typography>
                      <Typography
                        variant='subtitle2'
                        sx={{
                          whiteSpace: 'break-spaces'
                        }}
                      >
                        {step.description}
                      </Typography>
                    </Stack>
                  </MenuItem>
                );
              })}
            </Select>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
