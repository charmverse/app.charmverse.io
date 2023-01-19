export const postSortOptions = ['newest', 'most_commented', 'most_voted'] as const;

export type PostSortOption = typeof postSortOptions[number];

// Maxium posts we want per response
export const defaultPostsPerResult = 5;
