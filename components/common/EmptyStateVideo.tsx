import { Typography } from '@mui/material';

export function EmptyStateVideo(props: { description: string; videoTitle: string; videoUrl: string }) {
  return (
    <div data-test='empty-state'>
      <Typography variant='h6' gutterBottom>
        {props.description}
      </Typography>

      {/* Onboarding video when no bounties exist */}
      <iframe
        src={props.videoUrl}
        style={{ maxWidth: '100%', border: '0 none' }}
        height='367px'
        width='650px'
        title={props.videoTitle}
      ></iframe>
    </div>
  );
}
