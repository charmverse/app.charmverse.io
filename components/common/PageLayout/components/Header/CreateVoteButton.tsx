import Button from 'components/common/Button';

export function CreateVoteButton () {
  return (
    <Button
      variant='outlined'
      color='secondary'
      size='small'
      sx={{
        mx: 1
      }}
    >
      Create Vote
    </Button>
  );
}
