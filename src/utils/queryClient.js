import { QueryClient } from '@tanstack/react-query';

// Single shared QueryClient for the whole app. All data fetching and
// mutations flow through React Query so caching, retries, and invalidation
// stay consistent across the app.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
