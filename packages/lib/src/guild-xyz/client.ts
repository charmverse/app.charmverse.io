import { createGuildClient } from '@guildxyz/sdk';

// The only parameter is the name of your project
const guildClient = createGuildClient('CharmVerse');

export const guild = guildClient.guild;
export const user = guildClient.user;
