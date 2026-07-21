import { QueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: Platform.OS === 'web',
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

/** Clear cached API data when switching accounts (login / register / logout). */
export function clearAuthQueryCache() {
  queryClient.clear();
}
