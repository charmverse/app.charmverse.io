export const postSortOptions = ['new', 'hot', 'top'] as const; // Please use underscore if you have more then 1 word as a sort

export type PostSortOption = (typeof postSortOptions)[number];

// Maxium posts we want per response
export const defaultPostsPerResult = 5;
