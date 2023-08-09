import type { ProposalRubricCriteria, ProposalRubricCriteriaAnswer } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { Avatar, Box, FormGroup, TextField, Rating, Typography } from '@mui/material';
import { useMemo } from 'react';
import type { FieldArrayWithId, UseFormRegister } from 'react-hook-form';
import { useForm, useFieldArray } from 'react-hook-form';

import { Button } from 'components/common/Button';

export type FormInput = { answers: ProposalRubricCriteriaAnswer[] };

type Props = {
  answers?: ProposalRubricCriteriaAnswer[];
  criteriaList: ProposalRubricCriteria[];
  onSubmit: (values: FormInput) => void;
};

const StyledIcon = styled.div`
  align-items: center;
  border-radius: 50%;
  display: flex;
  width: 2em;
  height: 2em;
  justify-content: center;
  padding: 10px;
  background: #fff;
  border: 1px solid var(--input-border);
  text-align: center;
  font-size: 16px;
`;

const StyledRating = styled(Rating)`
  .icon {
    color: var(--primary-text);
  }
  .MuiRating-iconFilled .icon {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
    color: #fff;
  }
  .MuiRating-iconHover {
    transform: none;
  }
`;

export function RubricEvaluationForm({ criteriaList = [], answers = [], onSubmit }: Props) {
  const criteriaInputs = criteriaList.map((criteria) => ({
    ...criteria,
    answer: answers?.find((answer) => answer.rubricCriteriaId === criteria.id)
  }));
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid }
  } = useForm<FormInput>({
    // mode: 'onChange',
    defaultValues: {
      answers: criteriaInputs
    }
    // resolver: yupResolver(schema(hasCustomReward))
  });
  const { fields } = useFieldArray({ control, name: 'answers' });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box>
        {fields.map((field, index) => (
          <CriteriaInput
            key={field.id}
            criteria={criteriaInputs[index]}
            field={field}
            index={index}
            register={register}
          />
        ))}
        <Button type='submit'>Submit</Button>
      </Box>
    </form>
  );
}

function CriteriaInput({
  criteria,
  field,
  index,
  register
}: {
  criteria: ProposalRubricCriteria;
  field: FieldArrayWithId<FormInput, 'answers', 'id'>;
  index: number;
  register: UseFormRegister<FormInput>;
}) {
  const parameters = criteria.parameters as { min: number; max: number };
  const rangeLength = parameters.max - parameters.min;
  const minOffset = 1 - parameters.min; // Ratings component value always starts at 1
  const IconContainerComponent = useMemo(
    () =>
      // eslint-disable-next-line react/no-unstable-nested-components
      function NumberIcon({ value, ...other }: { value: number }) {
        return (
          <Box {...other} mx={0.5}>
            <StyledIcon className='icon'>{value - minOffset}</StyledIcon>
          </Box>
        );
      },
    [minOffset]
  );
  return (
    <FormGroup key={field.id} sx={{ mb: 2, display: 'flex', gap: 1 }}>
      <Box display='flex' justifyContent='space-between'>
        <div>
          <Typography variant='subtitle1'>
            {criteria.title} ({(criteria.parameters as any).min}&ndash;
            {(criteria.parameters as any).max})
          </Typography>
          {criteria.description && <Typography variant='body2'>{criteria.description}</Typography>}
        </div>
        <StyledRating
          {...register(`answers.${index}.response.score`)}
          IconContainerComponent={IconContainerComponent}
          max={(criteria.parameters as any).max + minOffset}
          highlightSelectedOnly
        />
      </Box>
      <TextField multiline placeholder='Leave a comment' {...register(`answers.${index}.comment`)}></TextField>
    </FormGroup>
  );
}
