import type {
  DraftProposalRubricCriteriaAnswer,
  ProposalRubricCriteria,
  ProposalRubricCriteriaAnswer
} from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { DeleteOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  FormGroup,
  FormLabel,
  IconButton,
  Stack,
  TextField,
  Rating,
  Tooltip,
  Typography
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { FieldArrayWithId, UseFormRegister } from 'react-hook-form';
import { useForm, useFieldArray, Controller } from 'react-hook-form';

import {
  useUpsertRubricCriteriaAnswers,
  useUpsertDraftRubricCriteriaAnswers,
  useDeleteRubricCriteriaAnswers
} from 'charmClient/hooks/proposals';
import { Button } from 'components/common/Button';
import { NumberInputField } from 'components/common/form/fields/NumberInputField';
import { usePersistentFormValues } from 'components/common/form/hooks/usePersistantFormValues';
import { useConfirmationModal } from 'hooks/useConfirmationModal';
import type { RubricAnswerData } from 'lib/proposals/rubric/upsertRubricAnswers';
import { getNumberFromString } from 'lib/utils/numbers';

export type FormInput = { answers: ProposalRubricCriteriaAnswer[] };

type Props = {
  proposalId: string;
  evaluationId: string;
  disabled: boolean; // for non-reviewers
  answers?: ProposalRubricCriteriaAnswer[];
  draftAnswers?: DraftProposalRubricCriteriaAnswer[];
  criteriaList: ProposalRubricCriteria[];
  onSubmit: (props: { isDraft: boolean }) => Promise<void>;
  archived?: boolean;
};

const CriteriaRow = styled(Box)`
  position: relative;
  flex-direction: row;

  ${({ theme }) => theme.breakpoints.up('xs')} {
    flex-direction: column;
  }

  ${({ theme }) => theme.breakpoints.up('sm')} {
    flex-direction: row;
  }

  ${({ theme }) => theme.breakpoints.up('sm')} {
    .show-on-hover {
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    }
    &:hover {
      .show-on-hover {
        opacity: 1;
      }
      .octo-propertyvalue:not(.readonly) {
        background-color: var(--mui-action-hover);
      }
    }
  }

  .drag-indicator {
    cursor: grab;
    margin-top: 7px;
    margin-left: -20px;
    position: absolute;
  }

  .to-pseudo-element {
    position: relative;
  }
  .to-pseudo-element::before {
    content: '-';
    left: -8px;
    top: 4px;
    position: absolute;
    font-size: 16px;
    color: var(--secondary-text);
  }
`;

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

export function RubricAnswersForm({
  proposalId,
  evaluationId,
  criteriaList = [],
  answers,
  disabled,
  draftAnswers,
  archived,
  onSubmit
}: Props) {
  const hasDraft = !!draftAnswers?.length;
  const { showConfirmation } = useConfirmationModal();
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
    setValue,
    reset,
    watch,
    formState: { isDirty }
  } = useForm<FormInput>({
    // mode: 'onChange',
    defaultValues: {
      answers: showDraftAnswers ? mapAnswersToFormValues(draftAnswers) : mapAnswersToFormValues(answers)
    }
  });

  const { fields } = useFieldArray({
    control,
    name: 'answers'
  });

  const answerValues = watch('answers');

  const answersError = answerValues.some((value) => typeof (value.response as any)?.score !== 'number')
    ? 'Every question of the evaluation must be answered'
    : undefined;

  async function submitAnswers(values: FormInput) {
    const { confirmed } = await showConfirmation({
      message: 'Submit your results?',
      confirmButton: 'Submit'
    });
    if (!confirmed) {
      return;
    }
    // HACK: we are not sure why rubricCriteriaId does not exist, seems to be an issue when two sets of rubric criteria exist
    const filteredAnswers = values.answers.filter((answer) => !!answer.rubricCriteriaId);
    await upsertRubricCriteriaAnswer({
      answers: filteredAnswers as unknown as RubricAnswerData[],
      evaluationId
    });
    // if draft is showing, delete it now that we updated the answers
    if (showDraftAnswers) {
      await deleteRubricCriteriaAnswers({
        isDraft: true,
        evaluationId
      });
    }
    onSubmit({ isDraft: false });
  }

  async function submitDraftAnswers(values: FormInput) {
    // HACK: we are not sure why rubricCriteriaId does not exist, seems to be an issue when two sets of rubric criteria exist
    const filteredAnswers = values.answers.filter((answer) => !!answer.rubricCriteriaId);
    await upsertDraftRubricCriteriaAnswer({
      // @ts-ignore -  TODO: make answer types match
      answers: filteredAnswers,
      evaluationId,
      isDraft: true
    });
    // switch to draft before updating the parent context, or else the two Alerts will flicker one after the other
    setShowDraftAnswers(true);
    await onSubmit({ isDraft: true });
  }

  async function deleteDraftAnswers() {
    await deleteRubricCriteriaAnswers({
      isDraft: true,
      evaluationId
    });
    // update the answers from parent context before switching from 'draft' view
    await onSubmit({ isDraft: true });
    setShowDraftAnswers(false);
  }

  function mapAnswersToFormValues(_answers?: (DraftProposalRubricCriteriaAnswer | ProposalRubricCriteriaAnswer)[]) {
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
    // include evaluationId so that answers reset when navigating between evaluations
  }, [answers, draftAnswers]);

  // persist form values to sessionStorage
  usePersistentFormValues(`proposalId-answers-${proposalId}`, 'answers', { watch, setValue });

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
          severity='warning'
          action={
            <Stack direction='row' gap={1}>
              <Button color='warning' variant='outlined' size='small' onClick={() => toggleDraftView(false)}>
                View submitted
              </Button>
              <Tooltip title='Delete draft'>
                <IconButton size='small' onClick={deleteDraftAnswers}>
                  <DeleteOutlined fontSize='small' />
                </IconButton>
              </Tooltip>
            </Stack>
          }
        >
          Viewing a draft
        </Alert>
      )}
      <Box p={2}>
        {fields.map((field, index) => (
          <CriteriaInput
            key={field.id}
            criteria={criteriaList[index]}
            value={answerValues[index]}
            field={field}
            index={index}
            control={control}
            register={register}
            disabled={disabled}
          />
        ))}
        <Box display='flex' gap={2}>
          <Stack justifyContent='flex-end' gap={2} direction='row' width='100%'>
            <Stack direction='row' gap={2}>
              {!disabled && (
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
              )}
            </Stack>
            <Button
              data-test='save-rubric-answers'
              sx={{ alignSelf: 'start' }}
              disabled={!!answersError || disabled || (!isDirty && !showDraftAnswers)}
              disabledTooltip={
                answersError ||
                (archived
                  ? 'You cannot evaluate an archived proposal'
                  : disabled
                    ? 'You must be a reviewer to submit an evaluation'
                    : undefined)
              }
              loading={isSaving}
              onClick={handleSubmit(submitAnswers)}
            >
              Submit
            </Button>
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
  disabled,
  field,
  value,
  index,
  control,
  register
}: {
  criteria: ProposalRubricCriteria;
  disabled?: boolean;
  field: FieldArrayWithId<FormInput, 'answers', 'id'>;
  value: FormInput['answers'][number]; // a readonly prop so we can do validation between fields
  index: number;
  control: any;
  register: UseFormRegister<FormInput>;
}) {
  const parameters = criteria.parameters as { min: number; max: number };
  const rangeLength = parameters.max - parameters.min + 1; // add one since the max is included
  const IconContainerComponent = useMemo(
    () =>
      // eslint-disable-next-line react/no-unstable-nested-components
      function NumberIcon({ value: _value, ...other }: { value: number }) {
        return (
          <Box {...other} mx={0.5}>
            <StyledIcon className='icon'>{convertMUIRatingToActual(_value, parameters.min)}</StyledIcon>
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
                  disabled={disabled}
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
                <Box display='flex' gap={1} alignItems='center'>
                  <FormLabel>
                    <Typography noWrap variant='body2'>
                      Your score ({parameters.min} &ndash; {parameters.max}):
                    </Typography>
                  </FormLabel>
                  <IntegerInput
                    data-test='rubric-criteria-score-input'
                    onChange={(score) => {
                      _field.onChange(score);
                    }}
                    disabled={disabled}
                    error={
                      (typeof _field.value === 'number' &&
                        (_field.value < parameters.min || _field.value > parameters.max) &&
                        'Invalid score') ||
                      (!!value.comment && typeof _field.value !== 'number' && 'Score is required') ||
                      ''
                    }
                    inputProps={{
                      placeholder: 'N/A',
                      min: parameters.min,
                      max: parameters.max
                    }}
                    value={_field.value}
                  />
                </Box>
              )
            }
            control={control}
            name={`answers.${index}.response.score`}
            defaultValue={(field.response as any)?.score}
          />
        </Box>
        <TextField
          data-test='rubric-criteria-score-comment'
          disabled={disabled}
          multiline
          placeholder='Add comments'
          {...register(`answers.${index}.comment`)}
        ></TextField>
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

function IntegerInput({
  value,
  onChange,
  inputProps,
  disabled,
  error,
  'data-test': dataTest
}: {
  value?: number | string | null;
  onChange: (num: number | null) => void;
  error?: string;
  inputProps?: any;
  disabled?: boolean;
  'data-test'?: string;
}) {
  return (
    <NumberInputField
      data-test={dataTest}
      disableArrows
      inline
      error={error}
      disabled={disabled}
      onChange={(e) => onChange(getNumberFromString(e.target.value))}
      inputProps={inputProps}
      value={value?.toString() || ''}
    />
  );
}
