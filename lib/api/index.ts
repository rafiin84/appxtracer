/**
 * The API surface the UI is written against.
 *
 * Every screen calls these functions through TanStack Query hooks in `hooks/`
 * and never reaches into `lib/mock` directly. Replacing the mock layer means
 * reimplementing this module against a real transport — the signatures, the
 * envelope and the domain types stay exactly as they are.
 */
export * from "./client";
export * from "./schemas";
export * from "./scopes";

export { getCommandCenter } from "./dashboard";
export {
  getApplication,
  getApplications,
  getExperience,
  getJourney,
  getJourneys,
} from "./catalog";
export { getChange, getChanges, getIncident, getIncidentContext, getIncidents } from "./operations";
export type { IncidentContext } from "./operations";
export { getCustomerTrace, getRecentCustomers, searchCustomers } from "./customers";
export type { EntityIndexEntry } from "./investigate";
export {
  ask,
  getAskSuggestions,
  getEvidence,
  getEvidenceBundle,
  getEvidenceById,
  getGraph,
  getImpactAnalysis,
  getEntityIndex,
  getPath,
  searchEntities,
} from "./investigate";
export { getExecutiveInsights, getShapeReports, getSources } from "./executive";
