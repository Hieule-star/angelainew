import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  // This project uses a relaxed tsconfig (strictNullChecks off) to stay
  // compatible with the ported ANGEL AI codebase, so the router options are
  // cast past TanStack's strict-mode type guard.
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  return router;
};
