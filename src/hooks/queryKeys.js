// Centralized React Query keys so queries and their invalidations stay in sync.
export const queryKeys = {
  wheels: {
    all: ['wheels'],
    mine: (userId) => ['wheels', 'mine', userId],
    shared: (shareId) => ['wheels', 'shared', shareId],
  },
};
