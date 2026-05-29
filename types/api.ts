export type Topic = {
  title: string;
  pillar: string;
  priority: "High" | "Medium" | "Low";
  priorityReason?: string;
  searchIntent: string;
  funnelStage?: "Awareness" | "Consideration" | "Decision" | string;
  contentType: string;
  /** True when the topic targets existing content that should be optimized, not net-new. */
  optimizationOpportunity?: boolean;
  rationale: string;
  targetKeywords: string[];
  estimatedDifficulty?: "Low" | "Medium" | "High" | string;
  estimatedImpact: string;
  internalLinkingOpportunity: string;
  suggestedAngle: string;
};

export type DataSummary = {
  gscInsights: string;
  semrushInsights: string;
  competitorInsights: string;
  contentGaps: string;
  overallAssessment?: string;
};

export type GenerateResponse = {
  dataSummary: DataSummary;
  topics: Topic[];
};
