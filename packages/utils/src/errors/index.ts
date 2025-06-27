// This avoid a large refactor across the app, and establishes common inheritance of base System Error
// We can migrate to direct imports from @packages/core/errors incrementally
export * from '@packages/core/errors';
