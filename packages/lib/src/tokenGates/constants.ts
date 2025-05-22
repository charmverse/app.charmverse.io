export const TOKEN_GATE_LIMITS = {
  public: { count: 1, restrictedChains: true },
  bronze: { count: 1, restrictedChains: true },
  silver: { count: 3, restrictedChains: false },
  gold: { count: Infinity, restrictedChains: false },
  grant: { count: Infinity, restrictedChains: false }
} as const;

export const RESTRICTED_TOKEN_GATE_CHAINS = ['ethereum'] as const;
