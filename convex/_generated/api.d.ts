/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as connectors from "../connectors.js";
import type * as http from "../http.js";
import type * as ledger from "../ledger.js";
import type * as nutrition from "../nutrition.js";
import type * as planner from "../planner.js";
import type * as services_sourcePolicy from "../services/sourcePolicy.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  connectors: typeof connectors;
  http: typeof http;
  ledger: typeof ledger;
  nutrition: typeof nutrition;
  planner: typeof planner;
  "services/sourcePolicy": typeof services_sourcePolicy;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
