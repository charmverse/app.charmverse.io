import { updateAllowedPlaybackDomains } from 'lib/mux/updateAllowedPlaybackDomains';

// run this to manually refresh the allowed domains for video playback via mux
(async () => {
  await updateAllowedPlaybackDomains();
})();
