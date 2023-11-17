import type { ProposalRubricCriteria, ProposalRubricCriteriaAnswer } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { Alert, Box, FormGroup, FormLabel, Stack, TextField, Rating, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { FieldArrayWithId, UseFormRegister } from 'react-hook-form';
import { useForm, useFieldArray, Controller } from 'react-hook-form';

import {
  useUpsertRubricCriteriaAnswers,
  useUpsertDraftRubricCriteriaAnswers,
  useDeleteRubricCriteriaAnswers
} from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import {
  IntegerInput,
  CriteriaRow
} from 'components/proposals/components/ProposalProperties/components/ProposalRubricCriteriaInput';

export type FormInput = { answers: ProposalRubricCriteriaAnswer[] };

type Props = {
  proposalId: string;
  disabled: boolean; // for non-reviewers
  answers?: ProposalRubricCriteriaAnswer[];
  draftAnswers?: ProposalRubricCriteriaAnswer[];
  criteriaList: ProposalRubricCriteria[];
  onSubmit: (props: { isDraft: boolean }) => void;
};

const StyledIcon = styled.div`
  align-items: center;
  border-radius: 50%;
  display: flex;
  width: 2em;
  height: 2em;
  justify-content: center;
  padding: 10px;
  border: 1px solid var(--input-border);
  text-align: center;
  font-size: 16px;
`;

const StyledRating = styled(Rating)`
  .icon {
    background-color: var(--background-default);
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

export function RubricEvaluationForm({
  proposalId,
  criteriaList = [],
  answers,
  disabled,
  draftAnswers,
  onSubmit
}: Props) {
  const hasDraft = !!draftAnswers?.length;

  const [showDraftAnswers, setShowDraftAnswers] = useState(hasDraft);

  const {
    error: answerError,
    isMutating: isSaving,
    trigger: upsertRubricCriteriaAnswer
  } = useUpsertRubricCriteriaAnswers({ proposalId });

  const {
    error: draftAnswerError,
    isMutating: draftIsSaving,
    trigger: upsertDraftRubricCriteriaAnswer
  } = useUpsertDraftRubricCriteriaAnswers({ proposalId });

  const { trigger: deleteRubricCriteriaAnswers } = useDeleteRubricCriteriaAnswers({ proposalId });

  const formError = draftAnswerError || answerError;
  const showDraftBanner = hasDraft && !showDraftAnswers;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid }
  } = useForm<FormInput>({
    // mode: 'onChange',
    defaultValues: {
      answers: showDraftAnswers ? mapAnswersToFormValues(draftAnswers) : mapAnswersToFormValues(answers)
    }
    // resolver: yupResolver(schema(hasCustomReward))
  });

  const { fields } = useFieldArray({ control, name: 'answers' });

  async function submitAnswers(values: FormInput) {
    // answers are optional - filter out ones with no score
    const filteredAnswers = values.answers.filter((answer) => typeof (answer.response as any)?.score === 'number');
    await upsertRubricCriteriaAnswer({
      // @ts-ignore -  TODO: make answer types match
      answers: filteredAnswers
    });
    // if draft is showing, delete it now that we updated the answers
    if (showDraftAnswers) {
      await deleteRubricCriteriaAnswers({
        isDraft: true
      });
    }
    onSubmit({ isDraft: false });
  }

  async function submitDraftAnswers(values: FormInput) {
    // answers are optional - filter out ones with no score
    const filteredAnswers = values.answers.filter((answer) => typeof (answer.response as any)?.score === 'number');
    await upsertDraftRubricCriteriaAnswer({
      // @ts-ignore -  TODO: make answer types match
      answers: filteredAnswers,
      isDraft: true
    });
    // switch to draft before updating the parent context, or else the two Alerts will flicker one after the other
    setShowDraftAnswers(true);
    await onSubmit({ isDraft: true });
  }

  async function deleteDraftAnswers() {
    await deleteRubricCriteriaAnswers({
      isDraft: true
    });
    // update the answers from parent context before switching from 'draft' view
    await onSubmit({ isDraft: true });
    setShowDraftAnswers(false);
  }

  function mapAnswersToFormValues(_answers?: ProposalRubricCriteriaAnswer[]) {
    return criteriaList.map(
      (criteria) =>
        _answers?.find((a) => a.rubricCriteriaId === criteria.id) || {
          rubricCriteriaId: criteria.id,
          // add default empty values so that isDirty is updated only when values actually change
          comment: '',
          response: { score: undefined }
        }
    );
  }

  function applyDraftValues() {
    reset({ answers: mapAnswersToFormValues(draftAnswers) }, { keepDirty: false });
  }

  function applyActualValues() {
    reset({ answers: mapAnswersToFormValues(answers) }, { keepDirty: false });
  }

  function toggleDraftView(showDraft: boolean) {
    setShowDraftAnswers(showDraft);
    if (showDraft) {
      applyDraftValues();
    } else {
      applyActualValues();
    }
  }

  useEffect(() => {
    if (answers && draftAnswers) {
      // set form values for the first time
      if (draftAnswers?.length && fields.length === 0) {
        setShowDraftAnswers(true);
        applyDraftValues();
      }
      // display actual values
      else if (!showDraftAnswers) {
        // update the form values when the criteria list loads
        applyActualValues();
      }
      // display draft values
      else {
        applyDraftValues();
      }
    }
  }, [answers, draftAnswers]);

  return (
    <form>
      {showDraftBanner && (
        <Alert
          action={
            <Button variant='outlined' size='small' onClick={() => toggleDraftView(true)}>
              View draft
            </Button>
          }
          severity='info'
        >
          You have a saved draft
        </Alert>
      )}
      {showDraftAnswers && (
        <Alert
          severity='info'
          action={
            <Button variant='outlined' size='small' onClick={() => toggleDraftView(false)}>
              View submitted
            </Button>
          }
        >
          Viewing a draft
        </Alert>
      )}
      <Box p={3}>
        {fields.map((field, index) => (
          <CriteriaInput
            key={field.id}
            criteria={criteriaList[index]}
            field={field}
            index={index}
            control={control}
            register={register}
          />
        ))}
        <Box display='flex' gap={2}>
          <Stack direction='row' gap={2}>
            <Button
              sx={{ alignSelf: 'start' }}
              disabled={!isDirty && !showDraftAnswers}
              loading={isSaving}
              onClick={handleSubmit(submitAnswers)}
            >
              Submit
            </Button>
            <Button
              sx={{ alignSelf: 'start' }}
              color='secondary'
              variant='outlined'
              disabled={!isDirty}
              loading={draftIsSaving}
              onClick={handleSubmit(submitDraftAnswers)}
            >
              {showDraftAnswers ? 'Update' : 'Save'} draft
            </Button>
            {showDraftAnswers && (
              <Button sx={{ alignSelf: 'start' }} color='secondary' variant='text' onClick={deleteDraftAnswers}>
                Delete draft
              </Button>
            )}
          </Stack>
          {formError && (
            <Typography variant='body2' color='error'>
              {formError.message}
            </Typography>
          )}
        </Box>
      </Box>
    </form>
  );
}

function CriteriaInput({
  criteria,
  field,
  index,
  control,
  register
}: {
  criteria: ProposalRubricCriteria;
  field: FieldArrayWithId<FormInput, 'answers', 'id'>;
  index: number;
  control: any;
  register: UseFormRegister<FormInput>;
}) {
  const parameters = criteria.parameters as { min: number; max: number };
  const rangeLength = parameters.max - parameters.min + 1; // add one since the max is included
  const IconContainerComponent = useMemo(
    () =>
      // eslint-disable-next-line react/no-unstable-nested-components
      function NumberIcon({ value, ...other }: { value: number }) {
        return (
          <Box {...other} mx={0.5}>
            <StyledIcon className='icon'>{convertMUIRatingToActual(value, parameters.min)}</StyledIcon>
          </Box>
        );
      },
    [parameters.min]
  );
  const muiMax = convertActualToMUIRating(parameters.max, parameters.min);
  const useRatingsInput = rangeLength < 8;

  return (
    <CriteriaRow key={field.id} mb={2}>
      <FormGroup sx={{ display: 'flex', gap: 1 }}>
        <div>
          <Typography>{criteria.title}</Typography>
          {criteria.description && (
            <Typography color='secondary' sx={{ whiteSpace: 'pre-line' }} variant='body2'>
              {criteria.description}
            </Typography>
          )}
        </div>
        <Box display='flex' justifyContent='space-between'>
          <Controller
            render={({ field: _field }) =>
              useRatingsInput ? (
                <StyledRating
                  value={
                    typeof _field.value === 'number' ? convertActualToMUIRating(_field.value, parameters.min) : null
                  }
                  IconContainerComponent={IconContainerComponent}
                  max={muiMax}
                  highlightSelectedOnly
                  onChange={(e, num) => {
                    _field.onChange(typeof num === 'number' ? convertMUIRatingToActual(num, parameters.min) : null);
                  }}
                />
              ) : (
                <Box display='flex' gap={1}>
                  <FormLabel>
                    <Typography noWrap variant='body2'>
                      Your score ({parameters.min} &ndash; {parameters.max}):
                    </Typography>
                  </FormLabel>
                  <IntegerInput
                    onChange={(score) => {
                      _field.onChange(score);
                    }}
                    inputProps={{
                      min: parameters.min,
                      max: parameters.max
                    }}
                    maxWidth={50}
                    value={_field.value}
                    sx={{ display: 'block' }}
                  />
                </Box>
              )
            }
            control={control}
            name={`answers.${index}.response.score`}
            defaultValue={(field.response as any)?.score}
          />
        </Box>
        <TextField multiline placeholder='Add comments' {...register(`answers.${index}.comment`)}></TextField>
      </FormGroup>
    </CriteriaRow>
  );
}

// Ratings component value always starts at 1, so subtract the difference between the min value and 1
function convertMUIRatingToActual(value: number, min: number) {
  const minOffset = 1 - min;
  return value - minOffset;
}

function convertActualToMUIRating(value: number, min: number) {
  const minOffset = 1 - min;
  return value + minOffset;
}
