export type Social = {
    twitterURL?: string;
    githubURL?: string;
    discordUsername?: string;
    linkedinURL?: string;
};

export const INTEGRATION_TYPES = ['Metamask', 'Discord', 'Telegram'] as const;
export type IntegrationType = typeof INTEGRATION_TYPES[number];
