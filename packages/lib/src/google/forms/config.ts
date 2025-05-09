export const formScopes =
  'email https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/forms.body.readonly https://www.googleapis.com/auth/forms.responses.readonly';

// This setting throttles the check for new responses to be no more than once a minute
export const syncThrottlePeriod = 1 * 60 * 1000;
