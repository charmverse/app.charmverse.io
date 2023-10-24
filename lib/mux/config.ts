export const muxTokenId = process.env.MUX_TOKEN_ID as string | undefined;
export const muxTokenSecret = process.env.MUX_TOKEN_SECRET as string | undefined;

// Playback Restriction restricts video to just charmverse domains. To generate a new restriction, use:
// curl 'https://api.mux.com/video/v1/playback-restrictions' \
//   -X POST \
//   -d '{ "referrer": { "allowed_domains": ["*.charmverse.io", "*.charmverse.co"] } }' \
//   -H "Content-Type: application/json" \
//   -u $MUX_TOKEN_ID:$MUX_TOKEN_SECRET
export const playbackRestrictionId = process.env.MUX_PLAYBACK_RESTRICTION_ID as string | undefined;
