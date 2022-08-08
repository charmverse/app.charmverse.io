import Typography from '@mui/material/Typography';
import { Application } from '@prisma/client';

export default function BountySubmissionStatus ({ submission }: {submission: Application}) {

  return (
    <>

      {
    submission.status === 'inProgress' && (
      <Typography variant='body2' color='secondary'>Awaiting submission</Typography>
    )
  }
      {
    submission.status === 'review' && (
      <Typography variant='body2' color='secondary'>Awaiting review</Typography>
    )
  }
      {
    submission.status === 'applied' && (
      <Typography variant='body2' color='secondary'>Awaiting assignment</Typography>
    )
  }
      {
    submission.status === 'complete' && (
      <Typography variant='body2' color='secondary'>Awaiting payment</Typography>
    )
  }
    </>
  );
}
