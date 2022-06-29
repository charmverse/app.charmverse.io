import { Box, List, ListItem, ListItemText, Paper, Typography } from '@mui/material';
import { VoteWithUsers } from 'lib/inline-votes/interfaces';
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import InlineCharmEditor from '../InlineCharmEditor';

interface PageInlineVoteProps {
  inlineVote: VoteWithUsers
}

export default function PageInlineVote ({ inlineVote }: PageInlineVoteProps) {
  const { deadline, description, title, userVotes, options, id } = inlineVote;
  const totalVotes = userVotes.length;
  const voteFrequencyRecord: Record<string, number> = useMemo(() => {
    return userVotes.reduce<Record<string, number>>((currentRecord, userVote) => {
      if (!currentRecord[userVote.choice]) {
        currentRecord[userVote.choice] = 1;
      }
      else {
        currentRecord[userVote.choice] += 1;
      }
      return currentRecord;
    }, {});
  }, [userVotes]);

  return (
    <Paper>
      <Typography>
        {title}
      </Typography>
      <InlineCharmEditor
        key={id}
        content={description}
        readOnly={true}
      />
      <Typography
        color='secondary'
        variant='subtitle1'
      >
        {DateTime.fromJSDate(new Date(deadline)).toRelative({ base: (DateTime.now()) })}
      </Typography>
      <Typography>
        {totalVotes} Votes
      </Typography>
      <List>
        {options.map((option, optionIndex) => (
          <ListItem sx={{ p: 0, display: 'flex', gap: 1 }}>
            <Box sx={{ p: 0, display: 'flex', gap: 1 }}>
              <ListItemText>{optionIndex + 1}</ListItemText>
              <ListItemText>{option.name}</ListItemText>
            </Box>
            <span>{((voteFrequencyRecord[option.name] / totalVotes) * 100).toFixed(2)}%</span>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
