import { Close as CloseIcon } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import { Grid, Stack, Tooltip, Typography } from '@mui/material';

import type { StepperProps } from './Stepper';
import { StepperStack } from './StepperIcon';

export function DesktopStepper({ steps, onClick, selected, value }: StepperProps) {
  const currentPosition = value ? steps.findIndex((step) => step.value === value) : -1;
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
                isSelected={step.value === selected}
                result={step.result}
                isCurrent={isCurrent}
                isDisabled={step.disabled}
              >
                <div className='stepper-icon' data-test={`proposal-status-stepper-${step.value}`}>
                  {step.result === 'pass' ? (
                    <CheckIcon fontSize='small' />
                  ) : step.result === 'fail' ? (
                    <CloseIcon fontSize='small' />
                  ) : (
                    <Typography fontWeight={500}>{position + 1}</Typography>
                  )}
                </div>
                <span onMouseOver={(e) => e.stopPropagation()} onFocus={(e) => e.stopPropagation()}>
                  <Tooltip title={step.description} placement='bottom'>
                    <Typography
                      textAlign='center'
                      fontWeight={currentPosition === position ? 600 : 400}
                      fontSize={14}
                      whiteSpace='nowrap'
                    >
                      {step.label}
                    </Typography>
                  </Tooltip>
                </span>
              </StepperStack>
            </Tooltip>
          </Grid>
        );
      })}
    </Grid>
  );
}
