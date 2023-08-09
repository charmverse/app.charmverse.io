import type { ProposalRubricCriteria, ProposalRubricCriteriaAnswer } from '@charmverse/core/prisma-client';
import { Box, FormGroup, TextField, Typography } from '@mui/material';
import { useForm, useFieldArray } from 'react-hook-form';

import { Button } from 'components/common/Button';

export type FormInput = { answers: ProposalRubricCriteriaAnswer[] };

type Props = {
  answers?: ProposalRubricCriteriaAnswer[];
  criteriaList: ProposalRubricCriteria[];
  onSubmit: (values: FormInput) => void;
};

export function RubricEvaluationForm({ criteriaList = [], answers = [], onSubmit }: Props) {
  const inputs = criteriaList.map((criteria) => ({
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
      answers: inputs
    }
    // resolver: yupResolver(schema(hasCustomReward))
  });
  const { fields } = useFieldArray({ control, name: 'answers' });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box>
        {fields.map((field, index) => (
          <FormGroup key={field.id}>
            <Typography variant='subtitle1'>
              {inputs[index].title} ({(inputs[index].parameters as any).min}&ndash;
              {(inputs[index].parameters as any).max})
            </Typography>
            <TextField {...register(`answers.${index}.comment`)}></TextField>
          </FormGroup>
        ))}
        <Button type='submit'>Submit</Button>
      </Box>
    </form>
  );
}
