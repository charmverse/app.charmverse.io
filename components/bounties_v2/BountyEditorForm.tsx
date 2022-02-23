import { yupResolver } from '@hookform/resolvers/yup';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import { Bounty, Bounty as IBounty } from '@prisma/client';
import charmClient from 'charmClient';
import { InputSearchContributor } from 'components/common/form/InputSearchContributor';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import CharmEditor, { ICharmEditorOutput } from 'components/editor/CharmEditor';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { CryptoCurrency } from 'models/Currency';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

export type FormMode = 'create' | 'update';

interface IBountyEditorInput {
  onSubmit: (bounty: Bounty) => any,
  mode?: FormMode
  bounty?: Partial<Bounty>
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
  const { setBounties, bounties } = useBounties();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isValid, isSubmitting }
  } = useForm<FormValues>({
    mode: 'onBlur',
    defaultValues: bounty as any,
    resolver: yupResolver(schema)
  });

  const [space] = useCurrentSpace();
  const [user] = useUser();

  async function submitted (value: IBounty) {
    if (mode === 'create') {
      value.spaceId = space!.id;
      value.createdBy = user!.id;
      // TODO: Should we allow empty description?
      value.description = value.description ?? '';
      const createdBounty = await charmClient.createBounty(value);
      setBounties([...bounties, createdBounty]);
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
              Description
            </InputLabel>
            <CharmEditor
              content={bounty?.descriptionNodes as any}
              onPageContentChange={pageContent => setRichContent(pageContent)}
            />
          </Grid>

          <Grid item>
            <InputLabel>
              Reviewer
            </InputLabel>
            <InputSearchContributor defaultValue={bounty?.reviewer!} onChange={setReviewer} />
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
              <InputSearchCrypto defaultValue={bounty?.rewardToken as CryptoCurrency} label='' register={register} modelKey='rewardToken' />
            </Grid>

          </Grid>

          <Grid item>
            <Button disabled={!isValid || isSubmitting} type='submit'>Create bounty</Button>
          </Grid>

        </Grid>

      </form>
    </div>
  );
}
