import { CompositeForm } from 'components/common/form/Form';
import { Bounty, Bounty as IBounty } from '@prisma/client';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { SchemaOf, ObjectSchema, AnySchema } from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import Input from '@mui/material/Input';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CharmEditor, { ICharmEditorOutput } from 'components/editor/CharmEditor';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import { InputSearchContributor } from 'components/common/form/InputSearchContributor';
import { IInputField } from '../common/form/GenericInput';
import BountyService from './BountyService';

interface IBountyEditorInput {
  onSubmit: (bounty: IBounty) => any,
  mode?: 'create' | 'update'
  bounty?: IBounty
}

export const schema = yup.object({
  title: yup.string().required('Please enter a title').min(10, 'Minimum of 10 characters'),
  rewardAmount: yup.number().required(),
  rewardToken: yup.string().required(),
  descriptionNodes: yup.mixed(),
  description: yup.string(),
  reviewer: yup.string()
});

type FormValues = yup.InferType<typeof schema>

export function BountyEditorForm ({ onSubmit, bounty, mode = 'create' }: IBountyEditorInput) {

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, touchedFields, isValid, isValidating }
  } = useForm<FormValues>({
    mode: 'onBlur',
    defaultValues: bounty as any,
    resolver: yupResolver(schema)
  });

  const [space] = useCurrentSpace();
  const [user] = useUser();

  const formValues = watch((value) => {
    console.log('Watching changes');
    console.log('Is valid', isValid, errors);
  });

  async function submitted (value: IBounty) {
    if (mode === 'create') {
      value.spaceId = space!.id;
      value.createdBy = user!.id;
      const createdBounty = await BountyService.createBounty(value);
      onSubmit(createdBounty);
    }
  }

  function setRichContent (content: ICharmEditorOutput) {
    setValue('descriptionNodes', content.doc);
    setValue('description', content.rawText);
  }

  function setReviewer (walletAddress: string) {
    setValue('reviewer', walletAddress);
  }

  return (
    <div>
      <form onSubmit={handleSubmit(formValue => submitted(formValue as IBounty))} style={{ margin: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
        <Grid container direction='column' spacing={3}>

          <Grid item>
            <InputLabel>
              Bounty title
            </InputLabel>
            <Input
              {...register('title')}
              type='text'
              fullWidth
            />

            {
              errors?.title && (
              <Alert severity='error'>
                {errors.title.message}
              </Alert>
              )
            }

          </Grid>

          <Grid item>
            <InputLabel>
              Extended description
            </InputLabel>
            <CharmEditor onPageContentChange={pageContent => setRichContent(pageContent)} />
          </Grid>

          <Grid item>
            <InputLabel>
              Reviewer
            </InputLabel>
            <InputSearchContributor onChange={setReviewer} />
          </Grid>

          <Grid container item>
            <Grid item xs={6}>

              <InputLabel>
                Reward amount
              </InputLabel>
              <Input
                {...register('rewardAmount', {
                  valueAsNumber: true
                })}
                type='number'
                inputProps={{ step: 0.000000001 }}
              />

              {
              errors?.rewardAmount && (
              <Alert severity='error'>
                {errors.rewardAmount.message}
              </Alert>
              )
            }

            </Grid>
            <Grid item xs={6}>
              <InputLabel>
                Reward token
              </InputLabel>
              <InputSearchCrypto label='' register={register} modelKey='rewardToken' />
            </Grid>

          </Grid>

          <Grid item>
            <Button disabled={!isValid} type='submit'>Create bounty</Button>
          </Grid>

        </Grid>

      </form>
    </div>
  );
}
