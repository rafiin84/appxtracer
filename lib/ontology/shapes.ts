/**
 * SHACL-style data-quality constraints.
 *
 * These are the shapes a production validation service would enforce against the
 * graph. Modelling them here does two jobs: it keeps the mock dataset honest
 * (the Administration screen runs them and reports real violations), and it
 * documents exactly which guarantees downstream UI is allowed to rely on.
 */
export type ShapeSeverity = "violation" | "warning" | "info";

export interface ShapeConstraint {
  id: string;
  /** SHACL node shape this would compile to. */
  shape: string;
  targetClass: string;
  label: string;
  description: string;
  severity: ShapeSeverity;
  /** Plain-language statement of the rule, shown in the UI. */
  rule: string;
}

export const SHAPES: ShapeConstraint[] = [
  {
    id: "shape-app-owner",
    shape: "appx:ApplicationShape",
    targetClass: "appx:Application",
    label: "Production applications must have an owner",
    description: "An unowned production application has no route to action when it degrades.",
    severity: "violation",
    rule: "sh:property [ sh:path appx:owner ; sh:minCount 1 ] applied where appx:environment = 'production'",
  },
  {
    id: "shape-app-environment",
    shape: "appx:ApplicationShape",
    targetClass: "appx:Application",
    label: "Every application must declare an environment",
    description: "Without an environment, impact cannot be scoped to production traffic.",
    severity: "violation",
    rule: "sh:property [ sh:path appx:environment ; sh:minCount 1 ; sh:in ('production' 'staging' 'disaster-recovery') ]",
  },
  {
    id: "shape-journey-owner",
    shape: "appx:BusinessJourneyShape",
    targetClass: "appx:BusinessJourney",
    label: "Critical journeys must have a business owner",
    description: "A mission-critical journey without a named owner cannot be governed.",
    severity: "violation",
    rule: "sh:property [ sh:path appx:owner ; sh:minCount 1 ] applied where appx:criticality in ('mission-critical' 'business-critical')",
  },
  {
    id: "shape-journey-application",
    shape: "appx:BusinessJourneyShape",
    targetClass: "appx:BusinessJourney",
    label: "Every journey must connect to at least one application",
    description: "A journey with no serving application cannot be traced to a technical cause.",
    severity: "violation",
    rule: "sh:property [ sh:path appx:servedBy ; sh:minCount 1 ]",
  },
  {
    id: "shape-journey-slo",
    shape: "appx:BusinessJourneyShape",
    targetClass: "appx:BusinessJourney",
    label: "Governed journeys must declare an SLO",
    description: "Health cannot be judged against intent without a target.",
    severity: "warning",
    rule: "sh:property [ sh:path appx:slo ; sh:minCount 1 ] applied where appx:discoveryState = 'governed'",
  },
  {
    id: "shape-journey-validated",
    shape: "appx:BusinessJourneyShape",
    targetClass: "appx:BusinessJourney",
    label: "Discovered journeys must be validated by a business owner",
    description:
      "A proposed journey has no owner, no agreed criticality and no SLO, so nothing it reports can be governed or actioned. This is the gap the Journeys screen asks a business owner to close.",
    severity: "warning",
    rule: "sh:property [ sh:path appx:validatedBy ; sh:minCount 1 ] applied where appx:discoveryState = 'proposed'",
  },
  {
    id: "shape-change-timestamp",
    shape: "appx:ChangeShape",
    targetClass: "appx:Change",
    label: "Every change must carry a timestamp",
    description: "Change correlation is a temporal operation; an undated change is unusable.",
    severity: "violation",
    rule: "sh:property [ sh:path appx:at ; sh:minCount 1 ; sh:datatype xsd:dateTime ]",
  },
  {
    id: "shape-change-target",
    shape: "appx:ChangeShape",
    targetClass: "appx:Change",
    label: "Every change must name at least one target entity",
    description: "A change with no target cannot be placed in the graph.",
    severity: "violation",
    rule: "sh:property [ sh:path appx:changed ; sh:minCount 1 ]",
  },
  {
    id: "shape-impact-basis",
    shape: "appx:ImpactEstimateShape",
    targetClass: "appx:ImpactEstimate",
    label: "Revenue estimates must declare a calculation basis",
    description: "A monetary figure without a stated method and inputs may not be shown to an executive.",
    severity: "violation",
    rule: "sh:property [ sh:path appx:calculationBasis ; sh:minCount 1 ] ; sh:property [ sh:path appx:provenance ; sh:in ('observed' 'derived') ]",
  },
  {
    id: "shape-evidence-source",
    shape: "appx:EvidenceShape",
    targetClass: "appx:Evidence",
    label: "Evidence must name a source and an observation time",
    description: "Unattributed evidence cannot support a claim.",
    severity: "violation",
    rule: "sh:property [ sh:path appx:source ; sh:minCount 1 ] ; sh:property [ sh:path appx:observedAt ; sh:minCount 1 ]",
  },
  {
    id: "shape-rootcause-confidence",
    shape: "appx:RootCauseShape",
    targetClass: "appx:RootCause",
    label: "Causal claims must carry a confidence and supporting evidence",
    description: "The product never asserts a cause it cannot show its work for.",
    severity: "violation",
    rule: "sh:property [ sh:path appx:confidence ; sh:minCount 1 ] ; sh:property [ sh:path appx:evidencedBy ; sh:minCount 1 ]",
  },
  {
    id: "shape-service-infrastructure",
    shape: "appx:ServiceShape",
    targetClass: "appx:Service",
    label: "Services should resolve to infrastructure",
    description: "A service with no runtime placement leaves a hole in the blast radius.",
    severity: "warning",
    rule: "sh:property [ sh:path appx:deployedOn ; sh:minCount 1 ]",
  },
  {
    id: "shape-customer-pii",
    shape: "appx:CustomerShape",
    targetClass: "appx:Customer",
    label: "Customer records must carry a masked identifier",
    description: "Surfaces that do not hold the PII scope render the masked form.",
    severity: "violation",
    rule: "sh:property [ sh:path appx:maskedIdentifier ; sh:minCount 1 ]",
  },
];

export interface ShapeReport {
  shapeId: string;
  label: string;
  severity: ShapeSeverity;
  targetClass: string;
  conforming: number;
  violating: number;
  /** Entity ids that failed, so the UI can link straight to them. */
  violatingIds: string[];
}
