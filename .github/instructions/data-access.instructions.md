---
description: "Use when fetching, reading, writing, updating, or deleting data, or calling Supabase (database tables, auth, or edge functions). Enforces that all data queries and mutations go through TanStack React Query hooks and never call the Supabase client directly from components."
name: "Data Access with React Query"
applyTo: "src/**/*.{js,jsx,ts,tsx}"
---

# Data Access: Always Use React Query

All data **queries** and **mutations** in this project MUST go through
[TanStack React Query](https://tanstack.com/query) (`@tanstack/react-query`).
Components, pages, and hooks must **never** call the Supabase client
(`supabase.from(...)`, `supabase.functions.invoke(...)`, `supabase.auth.*`)
directly.

## Architecture (three layers)

1. **Data-access layer** — `src/utils/*.js` (e.g. `wheels.js`, `chat.js`,
   `auth.js`). This is the ONLY place allowed to import and use the `supabase`
   client. Each function performs one Supabase operation and throws on error.
2. **React Query hooks** — `src/hooks/*.js`. Wrap the data-access functions in
   `useQuery` / `useMutation`. Components import from here.
3. **UI layer** — components and pages call the hooks. No direct Supabase usage.

The only exceptions that may touch `supabase` directly are the files in
`src/utils/` and the session container `src/auth/AuthProvider.jsx` (which owns
the auth session subscription).

## Rules

- Reads → `useQuery` with a stable, centralized key from `src/hooks/queryKeys.js`.
- Writes → `useMutation`; invalidate the affected query keys in `onSuccess`.
- Never import `supabase` into a component, page, or JSX file.
- Add a new data-access function in `src/utils/` and a matching hook in
  `src/hooks/` before consuming new data in the UI.
- Derive loading/error UI from the hook state (`isLoading`, `isError`,
  `isPending`) instead of manual `useState` flags.

## Query example

```jsx
// src/hooks/useWheels.js
export function useMyWheels(userId) {
  return useQuery({
    queryKey: queryKeys.wheels.mine(userId),
    queryFn: () => fetchMyWheels(userId),
    enabled: !!userId,
  });
}

// component
const { data: wheels = [], isLoading, error } = useMyWheels(user?.id);
```

## Mutation example

```jsx
// src/hooks/useWheels.js
export function useDeleteWheel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteWheel(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.wheels.all }),
  });
}

// component
const deleteWheel = useDeleteWheel();
deleteWheel.mutate(id, {
  onSuccess: () => {
    /* notify */
  },
});
```

## Anti-pattern (do NOT do this)

```jsx
// ❌ Never call Supabase directly from a component/page
import { supabase } from "../utils/supabase";
const { data } = await supabase.from("wheels").select("*");
```
