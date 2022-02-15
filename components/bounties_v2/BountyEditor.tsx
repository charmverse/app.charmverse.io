import BountyModal from 'components/bounties/BountyModal';
import { useForm } from 'react-hook-form';

import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/settings/FieldLabel';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import { PageContent } from 'models';

import BangleEditor, { IBangleEditorOutput } from 'components/editor/BangleEditor';
import { Bounty as IBounty } from 'models/Bounty';

import BountyService from './BountyService';

interface IBountyEditorInput {
  onSubmit: () => any,
  bounty?: IBounty
}

export function BountyEditor ({ onSubmit, bounty }: IBountyEditorInput) {

  const bountyDescription: PageContent = {
    type: 'doc'
  };

  let bangleContent: IBangleEditorOutput = {
    doc: {
      type: 'doc'
    },
    rawText: ''
  };

  function refreshBangleContent (content: IBangleEditorOutput) {
    bangleContent = content;
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm();

  async function createBounty (bountyToCreate: Partial<IBounty>) {
    bountyToCreate.description = bangleContent.rawText;
    bountyToCreate.descriptionNodes = bangleContent.doc;
    const created = await BountyService.createBounty(bountyToCreate);
    onSubmit();
  }

  return (
    <div>
      <h1>Bounty Editor</h1>

      <form onSubmit={handleSubmit(values => createBounty(values))}>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <TextField
              {...register('title')}
              fullWidth
              error={!!errors.title}
              placeholder='Bounty title'
              helperText={errors.title?.message}
              variant='outlined'
            />
          </Grid>

          <Grid item>
            <BangleEditor onPageContentChange={refreshBangleContent} />
          </Grid>

          <Grid item>
            <FieldLabel>Reward</FieldLabel>
            <Divider />
            <Box>
              <Grid container direction='row' alignItems='center' mt={1}>
                <Grid item xs={6}>
                  <Typography>Reviewer</Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    {...register('reviewer')}
                    fullWidth
                    variant='outlined'
                    error={!!errors?.reviewer}
                  />
                </Grid>
              </Grid>
              <Grid container direction='row' alignItems='center' mt={1}>
                <Grid item xs={6}>
                  <Typography>Assignee</Typography>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    {...register('assignee')}
                    fullWidth
                    variant='outlined'
                    error={!!errors?.assignee}
                  />
                </Grid>
              </Grid>

              {/* Render Token Select */}
              <Grid container direction='row' alignItems='center' mt={1}>
                <Grid item xs={6}>
                  <Typography>Token</Typography>
                </Grid>
                <Grid item xs={6}>
                  <InputSearchCrypto {...register('rewardToken')} defaultValue='ETH' onChange={() => {}} />
                </Grid>
              </Grid>
              {/* Render token amount */}
              <Grid container direction='row' alignItems='center' mt={1}>
                <Grid item xs={6}>
                  <Typography>Amount</Typography>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    {...register('rewardAmount')}
                    fullWidth
                    variant='outlined'
                    type='number'
                    error={!!errors?.rewardAmount}
                  />
                </Grid>
              </Grid>
              <br />
              <Divider />
            </Box>
          </Grid>
          <Grid item>
            <Box display='flex' justifyContent='flex-end'>
              <PrimaryButton type='submit'>
                Set bounty
              </PrimaryButton>
            </Box>
          </Grid>
        </Grid>

      </form>
    </div>
  );
}
