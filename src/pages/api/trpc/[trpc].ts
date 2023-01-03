import { createNextApiHandler } from "@trpc/server/adapters/next";

import { env } from "../../../env/server.mjs";
import { createContext } from "../../../server/trpc/context";
import { appRouter } from "../../../server/trpc/router/_app";

// export API handler
export default createNextApiHandler({
  router: appRouter,
  createContext,
  onError:
    env.NODE_ENV === "development"
      ? ({ path, error }) => {
          console.error(`❌ tRPC failed on ${path}: ${error}`);
        }
      : undefined,
  responseMeta: ({errors, type, paths}) => {
    const cache = paths && paths.every(path => path.includes('eval'))
    const ok = errors.length === 0
    const query = type === 'query'
    if (cache && ok && query) {
      return {
        headers: {
          'cache-control': `max-age=${env.CACHE_TIME}`
        }
      }
    }
    return {}
  }
});
