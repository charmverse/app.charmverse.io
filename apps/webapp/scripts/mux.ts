import { updateAllowedPlaybackDomains } from 'lib/mux/updateAllowedPlaybackDomains';

// run this to manually refresh the allowed domains for video playback via mux
(async () => {
  // Mux limits us to 100 domains
  await updateAllowedPlaybackDomains({ limit: 100 });
})();
