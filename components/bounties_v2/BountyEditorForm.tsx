import { CompositeForm } from 'components/common/form/Form';
import { Bounty as IBounty } from '@prisma/client';
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
import CharmEditor, { ICharmEditorOutput } from 'components/editor/CharmEditor';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
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
  description: yup.string()
});

type FormValues = yup.InferType<typeof schema>

export function BountyEditorForm ({ onSubmit, bounty, mode = 'create' }: IBountyEditorInput) {

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, touchedFields }
  } = useForm<FormValues>({
    defaultValues: bounty as any,
    resolver: yupResolver(schema)
  });

  const [space] = useCurrentSpace();
  const [user] = useUser();

  const formValues = watch();

  async function submitted (value: IBounty) {
    if (mode === 'create') {
      delete (value as any).linkedTaskId;
      value.spaceId = space!.id;
      value.createdBy = user!.id;
      value.assignee = user!.id;
      value.reviewer = user!.id;
      const createdBounty = await BountyService.createBounty(value as any);
      onSubmit(createdBounty as any);
    }
  }

  function setRichContent (content: ICharmEditorOutput) {
    setValue('descriptionNodes', content.doc);
    setValue('description', content.rawText);
  }

  return (
    <div>
      <form onSubmit={handleSubmit(formValue => submitted(formValue as IBounty))} style={{ margin: 'auto' }}>
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
          </Grid>

          <Grid item>
            <InputLabel>
              Extended description
            </InputLabel>
            <CharmEditor onPageContentChange={pageContent => setRichContent(pageContent)} />
          </Grid>

          <Grid item>
            <InputLabel>
              Reward amount
            </InputLabel>
            <Input
              {...register('rewardAmount', {
                valueAsNumber: true
              })}
              fullWidth
              type='number'
              inputProps={{ step: 0.000000001 }}
            />
          </Grid>

          <Grid item>
            <InputSearchCrypto register={register} modelKey='rewardToken' />
          </Grid>

          <Grid item>
            <Button type='submit'></Button>
          </Grid>

        </Grid>

      </form>
    </div>
  );
}
