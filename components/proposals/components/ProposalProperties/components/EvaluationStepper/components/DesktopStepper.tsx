import CheckIcon from '@mui/icons-material/Check';
import { Grid, Stack, Tooltip, Typography } from '@mui/material';
import { findIndex } from 'lodash';

import type { StepperProps } from './Stepper';
import { StepperStack } from './StepperIcon';

export function DesktopStepper({ steps, onClick, value }: StepperProps) {
  const currentPosition = value ? findIndex(steps, (step) => step.value === value) : -1;
  return (
    <Grid
      container
      display={{
        xs: 'none',
        md: 'flex'
      }}
    >
      {steps.map((step, position) => {
        const isCurrent = currentPosition === position;
        return (
          <Grid
            key={step.value}
            item
            xs
            display='flex'
            position='relative'
            alignItems='flex-start'
            justifyContent='center'
          >
            <Tooltip title={step.disabled ? '' : 'Open evaluation'}>
              <StepperStack
                alignItems='center'
                height='100%'
                gap={1}
                onClick={() => !step.disabled && onClick(step.value)}
                isComplete={step.completed}
                isCurrent={isCurrent}
                isDisabled={step.disabled}
              >
                <div className='stepper-icon' data-test={`proposal-status-stepper-${step.value}`}>
                  {currentPosition > position ? (
                    <CheckIcon fontSize='small' />
                  ) : (
                    <Typography fontWeight={500}>{position + 1}</Typography>
                  )}
                </div>
                <Typography
                  textAlign='center'
                  fontWeight={currentPosition === position ? 600 : 400}
                  fontSize={14}
                  whiteSpace='nowrap'
                >
                  {step.label}
                </Typography>
              </StepperStack>
            </Tooltip>
          </Grid>
        );
      })}
    </Grid>
  );
}
