/**
 * Security Configuration Management
 * Provides centralized security configuration, policy management, and compliance settings
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface SecurityConfiguration {
  version: string;
  lastUpdated: Date;
  frameworks: SecurityFramework[];
  policies: SecurityPolicy[];
  trustAnchors: TrustAnchor[];
  threatIntelligence: ThreatIntelligenceConfig;
  monitoring: MonitoringConfig;
  compliance: ComplianceConfig;
  incidentResponse: IncidentResponseConfig;
  sandbox: SandboxConfig;
  cryptography: CryptographyConfig;
  audit: AuditConfig;
  marketplace: MarketplaceSecurityConfig;
}

export interface SecurityFramework {
  name: string;
  enabled: boolean;
  controls: FrameworkControl[];
  requirements: FrameworkRequirement[];
  assessmentFrequency: string;
  nextAssessment: Date;
  scoreThreshold: number;
  autoRemediation: boolean;
}

export interface FrameworkControl {
  id: string;
  name: string;
  category: string;
  description: string;
  implementation: ControlImplementation;
  testing: ControlTesting;
  automated: boolean;
  criticality: 'HIGH' | 'MEDIUM' | 'LOW';
  owner: string;
}

export interface ControlImplementation {
  status: 'IMPLEMENTED' | 'PARTIAL' | 'NOT_IMPLEMENTED' | 'PLANNED';
  description: string;
  evidence: string[];
  lastUpdated: Date;
  nextReview: Date;
  responsible: string;
}

export interface ControlTesting {
  frequency: string;
  lastTest: Date;
  nextTest: Date;
  testResults: TestResult[];
  automated: boolean;
  passRate: number;
}

export interface TestResult {
  timestamp: Date;
  status: 'PASS' | 'FAIL' | 'WARNING';
  details: string;
  evidence?: string;
  score: number;
}

export interface FrameworkRequirement {
  id: string;
  title: string;
  description: string;
  category: string;
  mandatory: boolean;
  controls: string[];
  evidence: EvidenceRequirement[];
  dueDate?: Date;
}

export interface EvidenceRequirement {
  type: 'DOCUMENTATION' | 'CONFIGURATION' | 'LOG' | 'SCREENSHOT' | 'TEST_RESULT';
  description: string;
  source: string;
  frequency: string;
  retention: number; // days
}

export interface SecurityPolicy {
  id: string;
  name: string;
  version: string;
  category: PolicyCategory;
  description: string;
  purpose: string;
  scope: string;
  rules: PolicyRule[];
  exceptions: PolicyException[];
  enforcement: EnforcementConfig;
  compliance: ComplianceReference[];
  reviewCycle: string;
  lastReview: Date;
  nextReview: Date;
  owner: string;
  approvers: string[];
  status: 'ACTIVE' | 'DRAFT' | 'DEPRECATED' | 'DISABLED';
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: PolicyAction;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  enabled: boolean;
  priority: number;
  metadata: Record<string, any>;
  lastTriggered?: Date;
  triggerCount: number;
  falsePositiveRate: number;
}

export interface PolicyAction {
  type: 'ALLOW' | 'DENY' | 'WARN' | 'QUARANTINE' | 'ESCALATE' | 'LOG';
  parameters: Record<string, any>;
  notifications: NotificationConfig[];
  remediation?: RemediationAction;
}

export interface NotificationConfig {
  type: 'EMAIL' | 'SLACK' | 'WEBHOOK' | 'SMS' | 'PAGER';
  destination: string;
  template: string;
  conditions: string[];
  escalation?: NotificationEscalation;
}

export interface NotificationEscalation {
  delay: number; // minutes
  action: PolicyAction;
  conditions: string[];
}

export interface RemediationAction {
  type: 'AUTOMATED' | 'MANUAL';
  steps: RemediationStep[];
  timeout: number; // minutes
  approval: boolean;
}

export interface RemediationStep {
  name: string;
  action: string;
  parameters: Record<string, any>;
  timeout: number;
  rollback?: boolean;
}

export interface PolicyException {
  id: string;
  ruleId: string;
  reason: string;
  justification: string;
  approvedBy: string;
  approvedAt: Date;
  expiresAt: Date;
  conditions: string[];
  riskAcceptance: RiskAcceptance;
  reviewRequired: boolean;
  nextReview: Date;
}

export interface RiskAcceptance {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  justification: string;
  mitigatingControls: string[];
  monitoring: string;
  reviewPeriod: number; // days
}

export interface EnforcementConfig {
  level: 'PASSIVE' | 'ACTIVE' | 'BLOCKING';
  gracePeriod: number; // days
  warnings: number;
  autoBlock: boolean;
  quarantineDuration: number; // hours
}

export interface ComplianceReference {
  framework: string;
  control: string;
  requirement: string;
  mapping: string;
}

export type PolicyCategory =
  | 'ACCESS_CONTROL'
  | 'DATA_PROTECTION'
  | 'NETWORK_SECURITY'
  | 'ENDPOINT_SECURITY'
  | 'APPLICATION_SECURITY'
  | 'INCIDENT_RESPONSE'
  | 'BUSINESS_CONTINUITY'
  | 'RISK_MANAGEMENT'
  | 'TRAINING_AWARENESS';

export interface TrustAnchor {
  id: string;
  name: string;
  description: string;
  certificatePem: string;
  publicKey: string;
  fingerprint: string;
  issuer: string;
  subject: string;
  serialNumber: string;
  validFrom: Date;
  validTo: Date;
  crlDistributionPoints: string[];
  ocspUrls: string[];
  trustLevel: 'ROOT' | 'INTERMEDIATE' | 'END_ENTITY';
  enabled: boolean;
  lastVerified: Date;
  verificationStatus: 'VALID' | 'EXPIRED' | 'REVOKED' | 'UNKNOWN';
}

export interface ThreatIntelligenceConfig {
  enabled: boolean;
  sources: ThreatIntelSource[];
  feeds: ThreatFeed[];
  indicators: IndicatorConfig;
  attribution: AttributionConfig;
  sharing: SharingConfig;
  retention: number; // days
}

export interface ThreatIntelSource {
  name: string;
  type: 'COMMERCIAL' | 'OPEN_SOURCE' | 'GOVERNMENT' | 'INDUSTRY' | 'INTERNAL';
  url: string;
  apiKey?: string;
  format: 'STIX' | 'TAXII' | 'JSON' | 'CSV';
  updateFrequency: string;
  enabled: boolean;
  reliability: number; // 0-100
  coverage: string[];
  lastUpdate: Date;
}

export interface ThreatFeed {
  id: string;
  name: string;
  description: string;
  source: string;
  format: string;
  types: ThreatType[];
  confidence: number;
  ttl: number; // hours
  enabled: boolean;
}

export type ThreatType =
  | 'IP_ADDRESS'
  | 'DOMAIN'
  | 'URL'
  | 'HASH'
  | 'EMAIL'
  | 'USER_AGENT'
  | 'CERTIFICATE'
  | 'VULNERABILITY'
  | 'MALWARE'
  | 'CAMPAIGN'
  | 'ACTOR';

export interface IndicatorConfig {
  autoBlock: boolean;
  blockDuration: number; // hours
  falsePositiveHandling: FalsePositiveConfig;
  scoring: ScoringConfig;
  enrichment: EnrichmentConfig;
}

export interface FalsePositiveConfig {
  autoWhitelist: boolean;
  threshold: number;
  reviewRequired: boolean;
  reporting: boolean;
}

export interface ScoringConfig {
  algorithm: string;
  weights: Record<string, number>;
  thresholds: Record<string, number>;
  customRules: ScoringRule[];
}

export interface ScoringRule {
  name: string;
  condition: string;
  score: number;
  enabled: boolean;
}

export interface EnrichmentConfig {
  enabled: boolean;
  services: EnrichmentService[];
  cacheTTL: number; // minutes
}

export interface EnrichmentService {
  name: string;
  type: 'GEOLOCATION' | 'REPUTATION' | 'DOMAIN_INFO' | 'MALWARE_ANALYSIS' | 'THREAT_INTEL';
  apiKey?: string;
  enabled: boolean;
}

export interface AttributionConfig {
  enabled: boolean;
  frameworks: string[];
  confidence: number;
  techniques: string[];
  tactics: string[];
}

export interface SharingConfig {
  enabled: boolean;
  platforms: SharingPlatform[];
  anonymization: boolean;
  approval: boolean;
  frequency: string;
}

export interface SharingPlatform {
  name: string;
  type: 'MISP' | 'TAXII' | 'ISAC' | 'CUSTOM';
  endpoint: string;
  apiKey?: string;
  format: string;
  enabled: boolean;
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: MetricsConfig;
  alerts: AlertConfig;
  dashboards: DashboardConfig;
  retention: RetentionConfig;
}

export interface MetricsConfig {
  collection: CollectionConfig;
  storage: StorageConfig;
  processing: ProcessingConfig;
  analysis: AnalysisConfig;
}

export interface CollectionConfig {
  interval: number; // seconds
  batchSize: number;
  compression: boolean;
  encryption: boolean;
  sources: MetricSource[];
}

export interface MetricSource {
  name: string;
  type: 'SYSTEM' | 'APPLICATION' | 'NETWORK' | 'SECURITY' | 'BUSINESS';
  enabled: boolean;
  interval: number;
  filters: Record<string, any>;
}

export interface StorageConfig {
  type: 'FILE' | 'DATABASE' | 'TIMESERIES' | 'CLOUD';
  connectionString: string;
  retention: number; // days
  compression: boolean;
  encryption: boolean;
  partitioning: PartitionConfig;
}

export interface PartitionConfig {
  enabled: boolean;
  strategy: 'TIME' | 'SIZE' | 'HASH';
  interval: string;
  retention: number;
}

export interface ProcessingConfig {
  realTime: boolean;
  batchSize: number;
  workers: number;
  timeout: number; // seconds
  retryPolicy: RetryPolicy;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoff: 'LINEAR' | 'EXPONENTIAL';
  delay: number; // seconds
  maxDelay: number; // seconds
}

export interface AnalysisConfig {
  algorithms: AnalysisAlgorithm[];
  thresholds: AnalysisThreshold[];
  correlations: CorrelationRule[];
  anomalies: AnomalyDetectionConfig;
}

export interface AnalysisAlgorithm {
  name: string;
  type: 'STATISTICAL' | 'MACHINE_LEARNING' | 'RULE_BASED';
  enabled: boolean;
  parameters: Record<string, any>;
  trainingData?: string;
}

export interface AnalysisThreshold {
  metric: string;
  operator: 'GT' | 'LT' | 'EQ' | 'NE';
  value: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  duration: number; // seconds
}

export interface CorrelationRule {
  name: string;
  description: string;
  conditions: CorrelationCondition[];
  timeWindow: number; // seconds
  threshold: number;
  action: CorrelationAction;
  enabled: boolean;
}

export interface CorrelationCondition {
  field: string;
  operator: string;
  value: any;
  weight: number;
}

export interface CorrelationAction {
  type: 'ALERT' | 'INCIDENT' | 'BLOCK' | 'LOG';
  parameters: Record<string, any>;
}

export interface AnomalyDetectionConfig {
  enabled: boolean;
  algorithms: string[];
  sensitivity: number;
  trainingPeriod: number; // days
  falsePositiveRate: number;
}

export interface AlertConfig {
  rules: AlertRule[];
  channels: AlertChannel[];
  escalation: EscalationConfig;
  suppression: SuppressionConfig;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  channels: string[];
  cooldown: number; // seconds
  tags: string[];
}

export interface AlertChannel {
  id: string;
  name: string;
  type: 'EMAIL' | 'SLACK' | 'WEBHOOK' | 'SMS' | 'PAGER' | 'JIRA';
  configuration: Record<string, any>;
  enabled: boolean;
  rateLimit: RateLimitConfig;
}

export interface RateLimitConfig {
  enabled: boolean;
  limit: number;
  window: number; // seconds
}

export interface EscalationConfig {
  enabled: boolean;
  levels: EscalationLevel[];
  timeout: number; // minutes
}

export interface EscalationLevel {
  level: number;
  delay: number; // minutes
  channels: string[];
  conditions: string[];
}

export interface SuppressionConfig {
  enabled: boolean;
  rules: SuppressionRule[];
  defaultDuration: number; // minutes
}

export interface SuppressionRule {
  name: string;
  condition: string;
  duration: number; // minutes
  reason: string;
  createdBy: string;
  createdAt: Date;
}

export interface DashboardConfig {
  enabled: boolean;
  templates: DashboardTemplate[];
  customization: CustomizationConfig;
  sharing: SharingDashboardConfig;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  layout: LayoutConfig;
  refresh: number; // seconds
  public: boolean;
}

export interface Widget {
  id: string;
  type: 'CHART' | 'TABLE' | 'METRIC' | 'LOG' | 'ALERT' | 'MAP';
  title: string;
  query: string;
  visualization: VisualizationConfig;
  refresh: number; // seconds
}

export interface VisualizationConfig {
  type: string;
  options: Record<string, any>;
  colors: string[];
  legend: boolean;
  annotations: AnnotationConfig[];
}

export interface AnnotationConfig {
  type: string;
  condition: string;
  style: Record<string, any>;
}

export interface LayoutConfig {
  columns: number;
  rows: number;
  grid: GridLayout[];
}

export interface GridLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CustomizationConfig {
  themes: ThemeConfig[];
  branding: BrandingConfig;
  permissions: PermissionConfig;
}

export interface ThemeConfig {
  name: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
  default: boolean;
}

export interface BrandingConfig {
  logo: string;
  title: string;
  footer: string;
  colors: Record<string, string>;
}

export interface PermissionConfig {
  default: string[];
  roles: RoleConfig[];
}

export interface RoleConfig {
  name: string;
  permissions: string[];
  dashboards: string[];
}

export interface SharingDashboardConfig {
  enabled: boolean;
  publicAccess: boolean;
  authentication: boolean;
  expiration: number; // days
}

export interface RetentionConfig {
  enabled: boolean;
  policies: RetentionPolicy[];
  compression: boolean;
  archiving: ArchivingConfig;
}

export interface RetentionPolicy {
  dataType: string;
  retentionPeriod: number; // days
  action: 'DELETE' | 'ARCHIVE' | 'COMPRESS';
  conditions: string[];
  enabled: boolean;
}

export interface ArchivingConfig {
  enabled: boolean;
  destination: string;
  format: string;
  compression: boolean;
  encryption: boolean;
  schedule: string;
}

export interface ComplianceConfig {
  enabled: boolean;
  frameworks: ComplianceFramework[];
  assessments: AssessmentConfig;
  reporting: ReportingConfig;
  evidence: EvidenceConfig;
}

export interface ComplianceFramework {
  name: string;
  version: string;
  enabled: boolean;
  controls: FrameworkControlConfig[];
  requirements: FrameworkRequirementConfig[];
  mapping: ControlMapping[];
  assessment: FrameworkAssessmentConfig;
}

export interface FrameworkControlConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  implementation: string;
  testing: TestingConfig;
  automated: boolean;
  criticality: 'HIGH' | 'MEDIUM' | 'LOW';
  owner: string;
  evidence: string[];
}

export interface TestingConfig {
  frequency: string;
  automated: boolean;
  passRate: number;
  lastTest: Date;
  nextTest: Date;
}

export interface FrameworkRequirementConfig {
  id: string;
  title: string;
  description: string;
  category: string;
  mandatory: boolean;
  controls: string[];
  evidence: string[];
  dueDate?: Date;
}

export interface ControlMapping {
  controlId: string;
  requirementId: string;
  mappingType: 'PRIMARY' | 'SECONDARY' | 'PARTIAL';
  justification: string;
}

export interface FrameworkAssessmentConfig {
  frequency: string;
  methodology: string;
  scope: string[];
  criteria: AssessmentCriteria[];
  reporting: AssessmentReportingConfig;
}

export interface AssessmentCriteria {
  name: string;
  weight: number;
  measures: Measure[];
}

export interface Measure {
  name: string;
  type: 'QUANTITATIVE' | 'QUALITATIVE';
  target: number;
  actual?: number;
  evidence: string[];
}

export interface AssessmentReportingConfig {
  format: string;
  recipients: string[];
  distribution: string[];
  retention: number; // days
}

export interface AssessmentConfig {
  enabled: boolean;
  schedules: AssessmentSchedule[];
  automation: AutomationConfig;
  review: ReviewConfig;
}

export interface AssessmentSchedule {
  framework: string;
  frequency: string;
  nextAssessment: Date;
  scope: string[];
  automated: boolean;
}

export interface AutomationConfig {
  enabled: boolean;
  tools: AutomationTool[];
  workflows: Workflow[];
}

export interface AutomationTool {
  name: string;
  type: 'SCANNER' | 'TESTER' | 'ANALYZER' | 'REPORTER';
  configuration: Record<string, any>;
  enabled: boolean;
}

export interface Workflow {
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  conditions: WorkflowCondition[];
}

export interface WorkflowTrigger {
  type: 'SCHEDULE' | 'EVENT' | 'MANUAL';
  configuration: Record<string, any>;
}

export interface WorkflowStep {
  name: string;
  action: string;
  parameters: Record<string, any>;
  timeout: number;
  retryPolicy: RetryPolicy;
}

export interface WorkflowCondition {
  name: string;
  expression: string;
  action: 'CONTINUE' | 'SKIP' | 'FAIL';
}

export interface ReviewConfig {
  required: boolean;
  reviewers: string[];
  criteria: ReviewCriteria[];
  approval: ApprovalConfig;
}

export interface ReviewCriteria {
  name: string;
  description: string;
  mandatory: boolean;
  evidence: string[];
}

export interface ApprovalConfig {
  required: boolean;
  approvers: string[];
  quorum: number;
  timeout: number; // days
}

export interface ReportingConfig {
  enabled: boolean;
  templates: ReportTemplate[];
  schedules: ReportSchedule[];
  distribution: DistributionConfig;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'COMPLIANCE' | 'VULNERABILITY' | 'INCIDENT' | 'TREND' | 'EXECUTIVE';
  sections: ReportSection[];
  format: string;
  branding: boolean;
}

export interface ReportSection {
  name: string;
  type: 'TEXT' | 'CHART' | 'TABLE' | 'METRIC';
  configuration: Record<string, any>;
  order: number;
}

export interface ReportSchedule {
  templateId: string;
  frequency: string;
  recipients: string[];
  nextRun: Date;
  enabled: boolean;
}

export interface DistributionConfig {
  channels: DistributionChannel[];
  retention: number; // days
  encryption: boolean;
}

export interface DistributionChannel {
  type: 'EMAIL' | 'WEBHOOK' | 'API' | 'FILE_SYSTEM';
  configuration: Record<string, any>;
  enabled: boolean;
}

export interface EvidenceConfig {
  enabled: boolean;
  collection: EvidenceCollectionConfig;
  storage: EvidenceStorageConfig;
  retention: EvidenceRetentionConfig;
  verification: EvidenceVerificationConfig;
}

export interface EvidenceCollectionConfig {
  automated: boolean;
  sources: EvidenceSource[];
  frequency: string;
  metadata: EvidenceMetadataConfig;
}

export interface EvidenceSource {
  type: 'LOG' | 'CONFIGURATION' | 'SCREENSHOT' | 'DOCUMENTATION' | 'TEST_RESULT';
  source: string;
  format: string;
  enabled: boolean;
}

export interface EvidenceMetadataConfig {
  includeTimestamp: boolean;
  includeUser: boolean;
  includeSystem: boolean;
  includeLocation: boolean;
  custom: Record<string, any>;
}

export interface EvidenceStorageConfig {
  type: 'FILE' | 'DATABASE' | 'OBJECT_STORAGE';
  location: string;
  encryption: boolean;
  compression: boolean;
  backup: boolean;
}

export interface EvidenceRetentionConfig {
  default: number; // days
  byType: Record<string, number>;
  archival: boolean;
  archivalLocation: string;
}

export interface EvidenceVerificationConfig {
  enabled: boolean;
  hashAlgorithm: string;
  digitalSignature: boolean;
  timestamp: boolean;
  verificationFrequency: string;
}

export interface IncidentResponseConfig {
  enabled: boolean;
  playbooks: IncidentPlaybook[];
  escalation: EscalationPolicyConfig;
  communication: CommunicationConfig;
  tools: ResponseTool[];
  training: TrainingConfig;
}

export interface IncidentPlaybook {
  id: string;
  name: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity[];
  triggers: PlaybookTrigger[];
  procedures: Procedure[];
  recovery: RecoveryProcedure[];
  communication: CommunicationProcedure[];
  evidence: EvidenceProcedure[];
  postMortem: PostMortemProcedure[];
}

export type IncidentCategory = 'SECURITY' | 'COMPLIANCE' | 'OPERATIONAL' | 'PRIVACY' | 'AVAILABILITY';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PlaybookTrigger {
  type: 'EVENT' | 'THRESHOLD' | 'MANUAL' | 'SCHEDULED';
  condition: string;
  parameters: Record<string, any>;
}

export interface Procedure {
  id: string;
  name: string;
  description: string;
  steps: ProcedureStep[];
  timeout: number; // minutes
  required: boolean;
  automation: AutomationConfig;
}

export interface ProcedureStep {
  id: string;
  name: string;
  description: string;
  action: string;
  parameters: Record<string, any>;
  timeout: number; // minutes
  verification: VerificationStep[];
  rollback: RollbackStep[];
}

export interface VerificationStep {
  name: string;
  condition: string;
  expected: any;
  tolerance: number;
}

export interface RollbackStep {
  name: string;
  action: string;
  parameters: Record<string, any>;
  timeout: number; // minutes;
}

export interface RecoveryProcedure {
  description: string;
  steps: ProcedureStep[];
  rto: number; // Recovery Time Objective (minutes)
  rpo: number; // Recovery Point Objective (minutes)
}

export interface CommunicationProcedure {
  stakeholders: Stakeholder[];
  templates: CommunicationTemplate[];
  escalation: CommunicationEscalation[];
}

export interface Stakeholder {
  name: string;
  role: string;
  contact: ContactInfo[];
  notificationLevel: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface ContactInfo {
  type: 'EMAIL' | 'PHONE' | 'SLACK' | 'SMS';
  value: string;
  priority: number;
}

export interface CommunicationTemplate {
  name: string;
  subject: string;
  body: string;
  format: 'HTML' | 'TEXT' | 'MARKDOWN';
  variables: string[];
}

export interface CommunicationEscalation {
  condition: string;
  delay: number; // minutes
  stakeholders: string[];
  message: string;
}

export interface EvidenceProcedure {
  collection: EvidenceCollectionStep[];
  preservation: EvidencePreservationStep[];
  analysis: EvidenceAnalysisStep[];
}

export interface EvidenceCollectionStep {
  source: string;
  method: string;
  parameters: Record<string, any>;
  verification: boolean;
}

export interface EvidencePreservationStep {
  action: string;
  target: string;
  method: string;
  chainOfCustody: boolean;
}

export interface EvidenceAnalysisStep {
  tool: string;
  parameters: Record<string, any>;
  expectedResults: string[];
}

export interface PostMortemProcedure {
  timeline: TimelineStep[];
  analysis: AnalysisStep[];
  recommendations: RecommendationStep[];
  approval: ApprovalStep[];
  distribution: DistributionStep[];
}

export interface TimelineStep {
  source: string;
  method: string;
  verification: boolean;
}

export interface AnalysisStep {
  technique: string;
  tools: string[];
  parameters: Record<string, any>;
}

export interface RecommendationStep {
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timeframe: string;
  assignee: string;
  verification: boolean;
}

export interface ApprovalStep {
  required: boolean;
  approvers: string[];
  quorum: number;
  timeout: number; // days
}

export interface DistributionStep {
  channels: string[];
  format: string;
  retention: number; // days
  confidentiality: string;
}

export interface EscalationPolicyConfig {
  enabled: boolean;
  levels: EscalationLevel[];
  triggers: EscalationTrigger[];
  timeouts: EscalationTimeout[];
}

export interface EscalationTrigger {
  condition: string;
  level: number;
  immediate: boolean;
}

export interface EscalationTimeout {
  level: number;
  timeout: number; // minutes
  action: string;
}

export interface CommunicationConfig {
  channels: CommunicationChannel[];
  templates: MessageTemplate[];
  approvals: MessageApprovalConfig;
  encryption: boolean;
}

export interface MessageTemplate {
  name: string;
  type: 'INCIDENT' | 'ALERT' | 'UPDATE' | 'RESOLUTION';
  subject: string;
  body: string;
  format: 'HTML' | 'TEXT' | 'MARKDOWN';
  variables: string[];
}

export interface MessageApprovalConfig {
  required: boolean;
  approvers: string[];
  conditions: string[];
  timeout: number; // minutes
}

export interface ResponseTool {
  name: string;
  type: 'SIEM' | 'EDR' | 'FORENSICS' | 'VULNERABILITY' | 'THREAT_INTEL';
  configuration: Record<string, any>;
  integration: ToolIntegrationConfig;
  enabled: boolean;
}

export interface ToolIntegrationConfig {
  api: APIConfig;
  authentication: AuthenticationConfig;
  webhook: WebhookConfig;
  dataMapping: DataMappingConfig;
}

export interface APIConfig {
  baseUrl: string;
  version: string;
  timeout: number; // seconds
  retryPolicy: RetryPolicy;
}

export interface AuthenticationConfig {
  type: 'API_KEY' | 'OAUTH' | 'BASIC' | 'CERTIFICATE';
  credentials: Record<string, string>;
  refresh: number; // minutes
}

export interface WebhookConfig {
  url: string;
  events: string[];
  authentication: AuthenticationConfig;
  retryPolicy: RetryPolicy;
}

export interface DataMappingConfig {
  inbound: FieldMapping[];
  outbound: FieldMapping[];
  transformations: TransformationRule[];
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
}

export interface TransformationRule {
  name: string;
  type: 'FUNCTION' | 'LOOKUP' | 'CONDITIONAL' | 'REGEX';
  configuration: Record<string, any>;
}

export interface TrainingConfig {
  enabled: boolean;
  programs: TrainingProgram[];
  simulations: SimulationConfig[];
  certification: CertificationConfig[];
  tracking: TrainingTrackingConfig;
}

export interface TrainingProgram {
  name: string;
  description: string;
  targetAudience: string[];
  content: TrainingContent[];
  assessment: TrainingAssessment[];
  frequency: string;
  mandatory: boolean;
  duration: number; // hours
}

export interface TrainingContent {
  type: 'VIDEO' | 'DOCUMENT' | 'INTERACTIVE' | 'QUIZ';
  title: string;
  url: string;
  duration: number; // minutes
  order: number;
}

export interface TrainingAssessment {
  type: 'QUIZ' | 'PRACTICAL' | 'PROJECT';
  passingScore: number;
  attempts: number;
  questions?: AssessmentQuestion[];
}

export interface AssessmentQuestion {
  question: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY' | 'PRACTICAL';
  options?: string[];
  correctAnswer: any;
  explanation?: string;
}

export interface SimulationConfig {
  enabled: boolean;
  scenarios: SimulationScenario[];
  frequency: string;
  participants: ParticipantConfig[];
  evaluation: EvaluationConfig[];
}

export interface SimulationScenario {
  name: string;
  description: string;
  type: 'PHISHING' | 'MALWARE' | 'DATA_BREACH' | 'DDOS' | 'INSIDER_THREAT';
  complexity: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';
  duration: number; // minutes
  objectives: string[];
  playbooks: string[];
}

export interface ParticipantConfig {
  roles: ParticipantRole[];
  selection: ParticipantSelectionConfig;
  notification: ParticipantNotificationConfig;
}

export interface ParticipantRole {
  name: string;
  responsibilities: string[];
  capabilities: string[];
}

export interface ParticipantSelectionConfig {
  method: 'RANDOM' | 'BASED_ON_ROLE' | 'VOLUNTEER' | 'MANUAL';
  criteria: Record<string, any>;
  size: number;
}

export interface ParticipantNotificationConfig {
  advance: number; // days
  method: string[];
  template: string;
}

export interface EvaluationConfig {
  criteria: EvaluationCriteria[];
  scoring: ScoringMethod[];
  feedback: FeedbackConfig[];
  reporting: ReportingConfig;
}

export interface EvaluationCriteria {
  name: string;
  description: string;
  weight: number;
  measures: string[];
  thresholds: Record<string, number>;
}

export interface ScoringMethod {
  name: string;
  algorithm: string;
  parameters: Record<string, any>;
}

export interface FeedbackConfig {
  immediate: boolean;
  detailed: boolean;
  anonymous: boolean;
  template: string;
}

export interface CertificationConfig {
  required: boolean;
  programs: CertificationProgram[];
  tracking: CertificationTrackingConfig;
  renewal: CertificationRenewalConfig;
}

export interface CertificationProgram {
  name: string;
  provider: string;
  validPeriod: number; // days
  requirements: CertificationRequirement[];
  verification: boolean;
}

export interface CertificationRequirement {
  type: 'TRAINING' | 'EXPERIENCE' | 'ASSESSMENT';
  description: string;
  proof: boolean;
  verification: string;
}

export interface CertificationTrackingConfig {
  automated: boolean;
  reminders: ReminderConfig[];
  reporting: boolean;
  integration: IntegrationConfig[];
}

export interface ReminderConfig {
  timing: number; // days before expiry
  method: string[];
  template: string;
  escalation: boolean;
}

export interface IntegrationConfig {
  system: string;
  type: 'HR' | 'LEARNING' | 'CERTIFICATION';
  configuration: Record<string, any>;
}

export interface CertificationRenewalConfig {
  automatic: boolean;
  gracePeriod: number; // days
  requirements: CertificationRequirement[];
  process: RenewalProcess[];
}

export interface RenewalProcess {
  step: number;
  action: string;
  responsible: string;
  deadline: number; // days
}

export interface TrainingTrackingConfig {
  completion: CompletionTrackingConfig;
  performance: PerformanceTrackingConfig;
  reporting: TrainingReportingConfig;
}

export interface CompletionTrackingConfig {
  automated: boolean;
  milestones: MilestoneConfig[];
  notifications: NotificationConfig[];
}

export interface MilestoneConfig {
  name: string;
  percentage: number;
  celebration: boolean;
}

export interface PerformanceTrackingConfig {
  metrics: PerformanceMetric[];
  benchmarks: BenchmarkConfig[];
  improvement: ImprovementPlanConfig[];
}

export interface PerformanceMetric {
  name: string;
  type: 'TIME' | 'SCORE' | 'PARTICIPATION' | 'RETENTION';
  calculation: string;
  target: number;
}

export interface BenchmarkConfig {
  name: string;
  source: string;
  baseline: number;
  target: number;
  timeframe: string;
}

export interface ImprovementPlanConfig {
  triggers: ImprovementTrigger[];
  actions: ImprovementAction[];
  monitoring: MonitoringConfig;
}

export interface ImprovementTrigger {
  condition: string;
  threshold: number;
  duration: number;
}

export interface ImprovementAction {
  action: string;
  responsible: string;
  timeline: string;
  resources: string[];
}

export interface TrainingReportingConfig {
  frequency: string;
  recipients: string[];
  metrics: string[];
  format: string;
  dashboard: boolean;
}

export interface SandboxConfig {
  defaultProfile: SandboxProfile;
  profiles: SandboxProfile[];
  isolation: IsolationConfig;
  resources: ResourceLimitsConfig;
  network: NetworkSandboxConfig;
  filesystem: FilesystemSandboxConfig;
  monitoring: SandboxMonitoringConfig;
}

export interface SandboxProfile {
  name: string;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  permissions: string[];
  restrictions: SandboxRestriction[];
  timeout: number; // minutes
}

export interface SandboxRestriction {
  type: 'NETWORK' | 'FILESYSTEM' | 'PROCESS' | 'MEMORY' | 'API';
  scope: string;
  action: 'ALLOW' | 'DENY' | 'LIMIT' | 'MONITOR';
  parameters: Record<string, any>;
}

export interface IsolationConfig {
  type: 'CONTAINER' | 'VM' | 'PROCESS' | 'USER_NAMESPACE';
  technology: string;
  configuration: Record<string, any>;
  networking: NetworkIsolationConfig;
  storage: StorageIsolationConfig;
}

export interface NetworkIsolationConfig {
  namespace: boolean;
  firewall: boolean;
  proxy: boolean;
  dns: boolean;
}

export interface StorageIsolationConfig {
  quota: boolean;
  encryption: boolean;
  readonly: boolean;
  temporary: boolean;
}

export interface ResourceLimitsConfig {
  cpu: CPULimitConfig;
  memory: MemoryLimitConfig;
  disk: DiskLimitConfig;
  network: NetworkLimitConfig;
  processes: ProcessLimitConfig;
}

export interface CPULimitConfig {
  cores: number;
  time: number; // milliseconds
  priority: number;
}

export interface MemoryLimitConfig {
  limit: number; // bytes
  swap: number; // bytes
  overcommit: boolean;
}

export interface DiskLimitConfig {
  read: number; // bytes per second
  write: number; // bytes per second
  iops: number;
  quota: number; // bytes
}

export interface NetworkLimitConfig {
  bandwidth: number; // bytes per second
  connections: number;
  requests: number;
  latency: number; // milliseconds
}

export interface ProcessLimitConfig {
  count: number;
  threads: number;
  fileDescriptors: number;
}

export interface NetworkSandboxConfig {
  allowedHosts: string[];
  blockedHosts: string[];
  allowedPorts: number[];
  blockedPorts: number[];
  proxy: ProxyConfig;
  dns: DNSConfig;
}

export interface ProxyConfig {
  enabled: boolean;
  host: string;
  port: number;
  authentication: boolean;
  username?: string;
  password?: string;
  protocols: string[];
}

export interface DNSConfig {
  servers: string[];
  timeout: number; // milliseconds
  cache: boolean;
  cacheSize: number;
  blocklists: string[];
}

export interface FilesystemSandboxConfig {
  readonly: boolean;
  allowedPaths: string[];
  blockedPaths: string[];
  tempDirectory: string;
  maxFileSize: number; // bytes
  maxFiles: number;
  quota: number; // bytes
}

export interface SandboxMonitoringConfig {
  metrics: boolean;
  logs: boolean;
  traces: boolean;
  profiling: boolean;
  interval: number; // seconds
  storage: MonitoringStorageConfig;
}

export interface MonitoringStorageConfig {
  type: 'FILE' | 'DATABASE' | 'TIMESERIES';
  location: string;
  retention: number; // days
  compression: boolean;
}

export interface CryptographyConfig {
  algorithms: AlgorithmConfig[];
  keyManagement: KeyManagementConfig;
  certificates: CertificateConfig;
  encryption: EncryptionConfig;
  signing: SigningConfig;
  compliance: CryptoComplianceConfig;
}

export interface AlgorithmConfig {
  name: string;
  type: 'SYMMETRIC' | 'ASYMMETRIC' | 'HASH' | 'KEY_EXCHANGE';
  enabled: boolean;
  keySize: number;
  mode?: string;
  padding?: string;
}

export interface KeyManagementConfig {
  provider: KeyProviderConfig;
  rotation: KeyRotationConfig;
  storage: KeyStorageConfig;
  backup: KeyBackupConfig;
}

export interface KeyProviderConfig {
  type: 'SOFTWARE' | 'HSM' | 'CLOUD' | 'EXTERNAL';
  configuration: Record<string, any>;
  fallback: KeyProviderConfig[];
}

export interface KeyRotationConfig {
  enabled: boolean;
  frequency: string;
  overlap: number; // days
  automation: boolean;
}

export interface KeyStorageConfig {
  type: 'FILE' | 'DATABASE' | 'VAULT' | 'HSM';
  location: string;
  encryption: boolean;
  access: AccessControlConfig;
}

export interface AccessControlConfig {
  authentication: AuthenticationConfig;
  authorization: AuthorizationConfig;
  auditing: boolean;
}

export interface AuthorizationConfig {
  roles: RoleConfig[];
  permissions: PermissionConfig[];
  policies: AccessPolicyConfig[];
}

export interface AccessPolicyConfig {
  name: string;
  effect: 'ALLOW' | 'DENY';
  principal: string;
  action: string;
  resource: string;
  conditions: ConditionConfig[];
}

export interface ConditionConfig {
  operator: 'AND' | 'OR' | 'NOT';
  rules: RuleConfig[];
}

export interface RuleConfig {
  field: string;
  operator: string;
  value: any;
}

export interface KeyBackupConfig {
  enabled: boolean;
  frequency: string;
  location: string;
  encryption: boolean;
  retention: number; // days
}

export interface CertificateConfig {
  ca: CAConfig;
  issuance: IssuanceConfig;
  validation: ValidationConfig;
  revocation: RevocationConfig;
}

export interface CAConfig {
  type: 'INTERNAL' | 'EXTERNAL' | 'SELF_SIGNED';
  certificate: string;
  privateKey: string;
  crlDistributionPoints: string[];
  ocspUrls: string[];
}

export interface IssuanceConfig {
  automated: boolean;
  profiles: CertificateProfile[];
  approval: CertificateApprovalConfig;
}

export interface CertificateProfile {
  name: string;
  keySize: number;
  validityPeriod: number; // days
  extensions: CertificateExtension[];
  constraints: CertificateConstraint[];
}

export interface CertificateExtension {
  oid: string;
  critical: boolean;
  value: any;
}

export interface CertificateConstraint {
  type: 'BASIC' | 'NAME' | 'POLICY';
  configuration: Record<string, any>;
}

export interface CertificateApprovalConfig {
  required: boolean;
  approvers: string[];
  timeout: number; // days
  workflow: string[];
}

export interface ValidationConfig {
  enabled: boolean;
  methods: ValidationMethod[];
  revocationChecking: boolean;
  trustAnchors: string[];
}

export interface ValidationMethod {
  type: 'OCSP' | 'CRL' | 'AIA';
  enabled: boolean;
  configuration: Record<string, any>;
}

export interface RevocationConfig {
  enabled: boolean;
  method: 'CRL' | 'OCSP' | 'BOTH';
  distribution: RevocationDistributionConfig;
  signing: RevocationSigningConfig;
}

export interface RevocationDistributionConfig {
  crl: CRLConfig;
  ocsp: OCSPConfig;
}

export interface CRLConfig {
  enabled: boolean;
  distributionPoints: string[];
  updateFrequency: string;
  format: string;
}

export interface OCSPConfig {
  enabled: boolean;
  urls: string[];
  signingCertificate: string;
  signingKey: string;
  validUntil: number; // hours
}

export interface RevocationSigningConfig {
  algorithm: string;
  key: string;
  certificate: string;
  validityPeriod: number; // hours
}

export interface EncryptionConfig {
  default: DefaultEncryptionConfig;
  data: DataEncryptionConfig;
  communication: CommunicationEncryptionConfig;
  storage: StorageEncryptionConfig;
}

export interface DefaultEncryptionConfig {
  algorithm: string;
  keySize: number;
  mode: string;
  padding: string;
}

export interface DataEncryptionConfig {
  fields: FieldEncryptionConfig[];
  policies: EncryptionPolicyConfig[];
  keyDerivation: KeyDerivationConfig;
}

export interface FieldEncryptionConfig {
  field: string;
  algorithm: string;
  keyId: string;
  searchable: boolean;
}

export interface EncryptionPolicyConfig {
  name: string;
  condition: string;
  algorithm: string;
  keyRotation: boolean;
}

export interface KeyDerivationConfig {
  algorithm: string;
  iterations: number;
  saltLength: number;
}

export interface CommunicationEncryptionConfig {
  tls: TLSConfig;
  protocols: ProtocolConfig[];
  certificates: CommunicationCertificateConfig[];
}

export interface TLSConfig {
  minVersion: string;
  maxVersion: string;
  cipherSuites: string[];
  certificates: string[];
}

export interface ProtocolConfig {
  name: string;
  version: string;
  enabled: boolean;
  configuration: Record<string, any>;
}

export interface CommunicationCertificateConfig {
  name: string;
  certificate: string;
  privateKey: string;
  chain: string[];
 用途: string;
}

export interface StorageEncryptionConfig {
  enabled: boolean;
  algorithm: string;
  keyRotation: boolean;
  compression: boolean;
  integrity: boolean;
}

export interface SigningConfig {
  default: DefaultSigningConfig;
  algorithms: SigningAlgorithmConfig[];
  verification: VerificationConfig;
  timestamps: TimestampConfig;
}

export interface DefaultSigningConfig {
  algorithm: string;
  keySize: number;
  padding: string;
  digest: string;
}

export interface SigningAlgorithmConfig {
  name: string;
  type: 'RSA' | 'ECDSA' | 'EDDSA';
  keySizes: number[];
  enabled: boolean;
}

export interface TimestampConfig {
  enabled: boolean;
  authority: TSAConfig;
  format: string;
}

export interface TSAConfig {
  url: string;
  certificate: string;
  timeout: number; // seconds
  retryPolicy: RetryPolicy;
}

export interface CryptoComplianceConfig {
  fips: FIPSConfig;
  nist: NISTConfig;
  regulations: RegulationConfig[];
}

export interface FIPSConfig {
  enabled: boolean;
  mode: 'STRICT' | 'TRANSITIONAL';
  validatedModules: string[];
  selfTests: boolean;
}

export interface NISTConfig {
  standards: string[];
  curves: string[];
  algorithms: string[];
  keySizes: KeySizeConfig[];
}

export interface KeySizeConfig {
  algorithm: string;
  minSize: number;
  recommendedSize: number;
  maxSize: number;
}

export interface RegulationConfig {
  name: string;
  requirements: CryptoRequirement[];
  enforcement: boolean;
}

export interface CryptoRequirement {
  category: string;
  requirement: string;
  implementation: string;
  verification: string;
}

export interface AuditConfig {
  enabled: boolean;
  scope: AuditScopeConfig;
  retention: AuditRetentionConfig;
  formatting: AuditFormattingConfig;
  protection: AuditProtectionConfig;
}

export interface AuditScopeConfig {
  events: EventType[];
  users: UserScopeConfig;
  resources: ResourceScopeConfig;
  actions: ActionScopeConfig[];
  exclusions: ExclusionConfig[];
}

export interface EventType {
  category: string;
  types: string[];
  severity: string[];
}

export interface UserScopeConfig {
  include: string[];
  exclude: string[];
  roles: string[];
  privileges: string[];
}

export interface ResourceScopeConfig {
  types: string[];
  locations: string[];
  classifications: string[];
}

export interface ActionScopeConfig {
  types: string[];
  categories: string[];
  riskLevels: string[];
}

export interface ExclusionConfig {
  type: 'USER' | 'RESOURCE' | 'ACTION' | 'TIME';
  criteria: Record<string, any>;
  reason: string;
  approvedBy: string;
  expiresAt?: Date;
}

export interface AuditRetentionConfig {
  default: number; // days
  byType: Record<string, number>;
  archival: boolean;
  archivalLocation: string;
  archivalFormat: string;
}

export interface AuditFormattingConfig {
  format: 'JSON' | 'XML' | 'CEF' | 'LEEF' | 'SYSLOG';
  fields: FieldConfig[];
  enrichment: EnrichmentConfig;
  compression: boolean;
}

export interface FieldConfig {
  name: string;
  source: string;
  transformation: TransformationConfig;
  required: boolean;
}

export interface TransformationConfig {
  type: 'FORMAT' | 'MASK' | 'ENCRYPT' | 'HASH' | 'LOOKUP';
  configuration: Record<string, any>;
}

export interface AuditProtectionConfig {
  encryption: boolean;
  signing: boolean;
  integrity: boolean;
  access: AuditAccessConfig;
  tamperDetection: boolean;
}

export interface AuditAccessConfig {
  authentication: boolean;
  authorization: boolean;
  roles: string[];
  logging: boolean;
}

export interface MarketplaceSecurityConfig {
  enabled: boolean;
  verification: PluginVerificationConfig;
  scanning: SecurityScanningConfig;
  certification: PluginCertificationConfig;
  reputation: ReputationConfig;
  monitoring: MarketplaceMonitoringConfig;
}

export interface PluginVerificationConfig {
  required: boolean;
  minimumLevel: 'BASIC' | 'STANDARD' | 'ENHANCED' | 'ENTERPRISE';
  automaticRevocation: boolean;
  frequency: string;
}

export interface SecurityScanningConfig {
  staticAnalysis: StaticAnalysisConfig;
  dependencyScanning: DependencyScanningConfig;
  containerScanning: ContainerScanningConfig;
  secretsScanning: SecretsScanningConfig;
}

export interface StaticAnalysisConfig {
  enabled: boolean;
  tools: AnalysisToolConfig[];
  rules: AnalysisRuleConfig[];
  thresholds: AnalysisThresholdConfig[];
}

export interface AnalysisToolConfig {
  name: string;
  type: 'SAST' | 'DAST' | 'IAST';
  configuration: Record<string, any>;
  enabled: boolean;
}

export interface AnalysisRuleConfig {
  category: string;
  rules: RuleConfig[];
  customRules: CustomRuleConfig[];
}

export interface CustomRuleConfig {
  name: string;
  pattern: string;
  severity: string;
  description: string;
}

export interface AnalysisThresholdConfig {
  metric: string;
  threshold: number;
  action: 'WARN' | 'BLOCK' | 'REVIEW';
  severity: string;
}

export interface DependencyScanningConfig {
  enabled: boolean;
  databases: VulnerabilityDatabaseConfig[];
  frequency: string;
  remediation: RemediationConfig;
}

export interface VulnerabilityDatabaseConfig {
  name: string;
  url: string;
  apiKey?: string;
  updateFrequency: string;
  enabled: boolean;
}

export interface RemediationConfig {
  automatic: boolean;
  patches: boolean;
  alternatives: boolean;
  exceptions: ExceptionConfig[];
}

export interface ExceptionConfig {
  reason: string;
  approvedBy: string;
  expiresAt: Date;
  conditions: string[];
}

export interface ContainerScanningConfig {
  enabled: boolean;
  baseImages: BaseImageConfig[];
  policies: ContainerPolicyConfig[];
}

export interface BaseImageConfig {
  name: string;
  version: string;
  approved: boolean;
  scanDate: Date;
  vulnerabilities: VulnerabilityInfo[];
}

export interface VulnerabilityInfo {
  id: string;
  severity: string;
  description: string;
  fixedIn?: string;
}

export interface ContainerPolicyConfig {
  name: string;
  rules: ContainerRuleConfig[];
  enforcement: string;
}

export interface ContainerRuleConfig {
  type: string;
  condition: string;
  action: string;
  severity: string;
}

export interface SecretsScanningConfig {
  enabled: boolean;
  patterns: SecretPatternConfig[];
  verification: boolean;
  falsePositiveHandling: FalsePositiveConfig;
}

export interface SecretPatternConfig {
  name: string;
  pattern: string;
  type: string;
  severity: string;
  verification: boolean;
}

export interface PluginCertificationConfig {
  levels: CertificationLevelConfig[];
  process: CertificationProcessConfig[];
  auditTrail: boolean;
}

export interface CertificationLevelConfig {
  name: string;
  description: string;
  requirements: CertificationRequirement[];
  validity: number; // days
  renewal: CertificationRenewalConfig;
}

export interface CertificationProcessConfig {
  step: number;
  name: string;
  description: string;
  required: boolean;
  automation: boolean;
  approvers: string[];
}

export interface ReputationConfig {
  enabled: boolean;
  sources: ReputationSourceConfig[];
  scoring: ReputationScoringConfig[];
  display: boolean;
}

export interface ReputationSourceConfig {
  name: string;
  type: 'USER_REVIEWS' | 'DOWNLOAD_COUNT' | 'SECURITY_INCIDENTS' | 'COMMUNITY_TRUST';
  weight: number;
  updateFrequency: string;
}

export interface ReputationScoringConfig {
  algorithm: string;
  factors: ReputationFactorConfig[];
  thresholds: ReputationThresholdConfig[];
}

export interface ReputationFactorConfig {
  name: string;
  weight: number;
  calculation: string;
  source: string;
}

export interface ReputationThresholdConfig {
  level: string;
  minScore: number;
  restrictions: string[];
}

export interface MarketplaceMonitoringConfig {
  realTime: boolean;
  alerts: MarketplaceAlertConfig[];
  reporting: MarketplaceReportingConfig[];
}

export interface MarketplaceAlertConfig {
  type: string;
  condition: string;
  recipients: string[];
  severity: string;
}

export interface MarketplaceReportingConfig {
  frequency: string;
  recipients: string[];
  format: string;
  metrics: string[];
}

/**
 * Security Configuration Manager
 */
export class SecurityConfigurationManager {
  private config: SecurityConfiguration;
  private configPath: string;
  private encryptionKey: string;

  constructor(configPath: string, encryptionKey?: string) {
    this.configPath = configPath;
    this.encryptionKey = encryptionKey || process.env.SECURITY_CONFIG_KEY || 'default-key';
    this.config = this.createDefaultConfiguration();
  }

  /**
   * Load security configuration from file
   */
  async load(): Promise<SecurityConfiguration> {
    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      const decryptedData = this.decrypt(configData);
      this.config = JSON.parse(decryptedData);

      console.log(`[CONFIG] Security configuration loaded from ${this.configPath}`);
      return this.config;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('[CONFIG] Configuration file not found, using defaults');
        return this.config;
      }
      throw new Error(`Failed to load security configuration: ${error.message}`);
    }
  }

  /**
   * Save security configuration to file
   */
  async save(): Promise<void> {
    try {
      const configData = JSON.stringify(this.config, null, 2);
      const encryptedData = this.encrypt(configData);

      await fs.writeFile(this.configPath, encryptedData, 'utf-8');
      console.log(`[CONFIG] Security configuration saved to ${this.configPath}`);
    } catch (error) {
      throw new Error(`Failed to save security configuration: ${error.message}`);
    }
  }

  /**
   * Get the current configuration
   */
  getConfiguration(): SecurityConfiguration {
    return { ...this.config };
  }

  /**
   * Update configuration section
   */
  updateSection(section: keyof SecurityConfiguration, value: any): void {
    (this.config as any)[section] = value;
    this.config.lastUpdated = new Date();
  }

  /**
   * Validate configuration
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required sections
    const requiredSections = ['version', 'frameworks', 'policies', 'monitoring', 'compliance'];
    for (const section of requiredSections) {
      if (!(this.config as any)[section]) {
        errors.push(`Missing required configuration section: ${section}`);
      }
    }

    // Validate framework configurations
    for (const framework of this.config.frameworks) {
      if (!framework.name || !framework.controls) {
        errors.push(`Invalid framework configuration: ${framework.name}`);
      }
    }

    // Validate policy configurations
    for (const policy of this.config.policies) {
      if (!policy.id || !policy.rules || policy.rules.length === 0) {
        errors.push(`Invalid policy configuration: ${policy.id}`);
      }
    }

    // Validate encryption settings
    if (this.config.cryptography.algorithms.length === 0) {
      warnings.push('No cryptographic algorithms configured');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Export configuration
   */
  export(format: 'JSON' | 'YAML' | 'TOML'): string {
    switch (format) {
      case 'JSON':
        return JSON.stringify(this.config, null, 2);
      case 'YAML':
        // Would use a YAML library here
        return '# YAML export not implemented';
      case 'TOML':
        // Would use a TOML library here
        return '# TOML export not implemented';
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Import configuration
   */
  import(configData: string, format: 'JSON' | 'YAML' | 'TOML'): void {
    try {
      let parsedConfig: SecurityConfiguration;

      switch (format) {
        case 'JSON':
          parsedConfig = JSON.parse(configData);
          break;
        case 'YAML':
        case 'TOML':
          throw new Error(`${format} import not implemented`);
        default:
          throw new Error(`Unsupported import format: ${format}`);
      }

      // Validate imported configuration
      const validation = this.validateConfiguration(parsedConfig);
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      this.config = parsedConfig;
      this.config.lastUpdated = new Date();

    } catch (error) {
      throw new Error(`Failed to import configuration: ${error.message}`);
    }
  }

  // Private helper methods
  private createDefaultConfiguration(): SecurityConfiguration {
    return {
      version: '1.0.0',
      lastUpdated: new Date(),
      frameworks: [],
      policies: [],
      trustAnchors: [],
      threatIntelligence: {
        enabled: false,
        sources: [],
        feeds: [],
        indicators: {
          autoBlock: false,
          blockDuration: 24,
          falsePositiveHandling: {
            autoWhitelist: false,
            threshold: 5,
            reviewRequired: true,
            reporting: true
          },
          scoring: {
            algorithm: 'WEIGHTED_AVERAGE',
            weights: {},
            thresholds: {},
            customRules: []
          },
          enrichment: {
            enabled: false,
            services: [],
            cacheTTL: 60
          }
        },
        attribution: {
          enabled: false,
          frameworks: [],
          confidence: 70,
          techniques: [],
          tactics: []
        },
        sharing: {
          enabled: false,
          platforms: [],
          anonymization: true,
          approval: true,
          frequency: 'DAILY'
        },
        retention: 365
      },
      monitoring: {
        enabled: true,
        metrics: {
          collection: {
            interval: 60,
            batchSize: 100,
            compression: true,
            encryption: true,
            sources: []
          },
          storage: {
            type: 'DATABASE',
            connectionString: '',
            retention: 90,
            compression: true,
            encryption: true,
            partitioning: {
              enabled: true,
              strategy: 'TIME',
              interval: 'DAILY',
              retention: 90
            }
          },
          processing: {
            realTime: true,
            batchSize: 50,
            workers: 4,
            timeout: 30,
            retryPolicy: {
              maxAttempts: 3,
              backoff: 'EXPONENTIAL',
              delay: 1,
              maxDelay: 60
            }
          },
          analysis: {
            algorithms: [],
            thresholds: [],
            correlations: [],
            anomalies: {
              enabled: true,
              algorithms: ['STATISTICAL', 'MACHINE_LEARNING'],
              sensitivity: 70,
              trainingPeriod: 30,
              falsePositiveRate: 5
            }
          }
        },
        alerts: {
          rules: [],
          channels: [],
          escalation: {
            enabled: true,
            levels: [],
            timeout: 60
          },
          suppression: {
            enabled: true,
            rules: [],
            defaultDuration: 60
          }
        },
        dashboards: {
          enabled: true,
          templates: [],
          customization: {
            themes: [],
            branding: {
              logo: '',
              title: 'Security Dashboard',
              footer: '',
              colors: {}
            },
            permissions: {
              default: ['READ'],
              roles: []
            }
          },
          sharing: {
            enabled: false,
            publicAccess: false,
            authentication: true,
            expiration: 30
          }
        },
        retention: {
          enabled: true,
          policies: [],
          compression: true,
          archiving: {
            enabled: false,
            destination: '',
            format: 'JSON',
            compression: true,
            encryption: true,
            schedule: 'WEEKLY'
          }
        }
      },
      compliance: {
        enabled: true,
        frameworks: [],
        assessments: {
          enabled: true,
          schedules: [],
          automation: {
            enabled: true,
            tools: [],
            workflows: []
          },
          review: {
            required: true,
            reviewers: [],
            criteria: [],
            approval: {
              required: true,
              approvers: [],
              quorum: 1,
              timeout: 7
            }
          }
        },
        reporting: {
          enabled: true,
          templates: [],
          schedules: [],
          distribution: {
            channels: [],
            retention: 365,
            encryption: true
          }
        },
        evidence: {
          enabled: true,
          collection: {
            automated: true,
            sources: [],
            frequency: 'DAILY',
            metadata: {
              includeTimestamp: true,
              includeUser: true,
              includeSystem: false,
              includeLocation: false,
              custom: {}
            }
          },
          storage: {
            type: 'OBJECT_STORAGE',
            location: '',
            encryption: true,
            compression: true,
            backup: true
          },
          retention: {
            default: 2555, // 7 years
            byType: {},
            archival: true,
            archivalLocation: ''
          },
          verification: {
            enabled: true,
            hashAlgorithm: 'SHA-256',
            digitalSignature: false,
            timestamp: true,
            verificationFrequency: 'WEEKLY'
          }
        }
      },
      incidentResponse: {
        enabled: true,
        playbooks: [],
        escalation: {
          enabled: true,
          levels: [],
          triggers: [],
          timeouts: []
        },
        communication: {
          channels: [],
          templates: [],
          approvals: {
            required: false,
            approvers: [],
            conditions: [],
            timeout: 60
          },
          encryption: true
        },
        tools: [],
        training: {
          enabled: false,
          programs: [],
          simulations: {
            enabled: false,
            scenarios: [],
            frequency: 'QUARTERLY',
            participants: {
              roles: [],
              selection: {
                method: 'VOLUNTEER',
                criteria: {},
                size: 5
              },
              notification: {
                advance: 7,
                method: ['EMAIL'],
                template: 'SIMULATION_NOTIFICATION'
              }
            },
            evaluation: {
              criteria: [],
              scoring: [],
              feedback: {
                immediate: true,
                detailed: true,
                anonymous: false,
                template: 'SIMULATION_FEEDBACK'
              },
              reporting: {
                frequency: 'IMMEDIATE',
                recipients: [],
                metrics: [],
                format: 'PDF',
                dashboard: true
              }
            }
          },
          certification: {
            required: false,
            programs: [],
            tracking: {
              automated: true,
              reminders: {
                timing: 30,
                method: ['EMAIL'],
                template: 'CERTIFICATION_REMINDER',
                escalation: true
              },
              reporting: true,
              integration: []
            },
            renewal: {
              automatic: false,
              gracePeriod: 30,
              requirements: [],
              process: []
            }
          },
          tracking: {
            completion: {
              automated: true,
              milestones: [],
              notifications: []
            },
            performance: {
              metrics: [],
              benchmarks: [],
              improvement: {
                triggers: [],
                actions: [],
                monitoring: {
                  enabled: true,
                  interval: 60,
                  retention: 90
                }
              }
            },
            reporting: {
              frequency: 'MONTHLY',
              recipients: [],
              metrics: [],
              format: 'PDF',
              dashboard: true
            }
          }
        }
      },
      sandbox: {
        defaultProfile: {
          name: 'default',
          description: 'Default sandbox profile',
          riskLevel: 'MEDIUM',
          permissions: ['READ', 'EXECUTE'],
          restrictions: [],
          timeout: 30
        },
        profiles: [],
        isolation: {
          type: 'CONTAINER',
          technology: 'docker',
          configuration: {},
          networking: {
            namespace: true,
            firewall: true,
            proxy: false,
            dns: true
          },
          storage: {
            quota: true,
            encryption: false,
            readonly: false,
            temporary: true
          }
        },
        resources: {
          cpu: {
            cores: 1,
            time: 300000,
            priority: 10
          },
          memory: {
            limit: 536870912,
            swap: 0,
            overcommit: false
          },
          disk: {
            read: 1048576,
            write: 1048576,
            iops: 1000,
            quota: 1073741824
          },
          network: {
            bandwidth: 1048576,
            connections: 10,
            requests: 100,
            latency: 1000
          },
          processes: {
            count: 5,
            threads: 10,
            fileDescriptors: 100
          }
        },
        network: {
          allowedHosts: [],
          blockedHosts: ['0.0.0.0/8', '169.254.0.0/16'],
          allowedPorts: [80, 443],
          blockedPorts: [22, 23, 25, 53, 135, 137, 138, 139, 445],
          proxy: {
            enabled: false,
            host: '',
            port: 0,
            authentication: false,
            protocols: ['HTTP', 'HTTPS']
          },
          dns: {
            servers: ['8.8.8.8', '8.8.4.4'],
            timeout: 5000,
            cache: true,
            cacheSize: 1000,
            blocklists: []
          }
        },
        filesystem: {
          readonly: false,
          allowedPaths: ['/tmp/plugin-storage'],
          blockedPaths: ['/etc', '/usr/bin', '/root', '/home'],
          tempDirectory: '/tmp/plugin-temp',
          maxFileSize: 10485760,
          maxFiles: 100,
          quota: 1073741824
        },
        monitoring: {
          metrics: true,
          logs: true,
          traces: false,
          profiling: false,
          interval: 5,
          storage: {
            type: 'DATABASE',
            location: '',
            retention: 30,
            compression: true
          }
        }
      },
      cryptography: {
        algorithms: [
          {
            name: 'AES-256-GCM',
            type: 'SYMMETRIC',
            enabled: true,
            keySize: 256,
            mode: 'GCM'
          },
          {
            name: 'RSA-4096',
            type: 'ASYMMETRIC',
            enabled: true,
            keySize: 4096
          },
          {
            name: 'SHA-256',
            type: 'HASH',
            enabled: true,
            keySize: 256
          }
        ],
        keyManagement: {
          provider: {
            type: 'SOFTWARE',
            configuration: {},
            fallback: []
          },
          rotation: {
            enabled: true,
            frequency: 'QUARTERLY',
            overlap: 7,
            automation: true
          },
          storage: {
            type: 'VAULT',
            location: '',
            encryption: true,
            access: {
              authentication: {
                type: 'OAUTH',
                credentials: {},
                refresh: 3600
              },
              authorization: {
                roles: [],
                permissions: [],
                policies: []
              },
              auditing: true
            }
          },
          backup: {
            enabled: true,
            frequency: 'WEEKLY',
            location: '',
            encryption: true,
            retention: 2555
          }
        },
        certificates: {
          ca: {
            type: 'INTERNAL',
            certificate: '',
            privateKey: '',
            crlDistributionPoints: [],
            ocspUrls: []
          },
          issuance: {
            automated: true,
            profiles: [],
            approval: {
              required: false,
              approvers: [],
              timeout: 7,
              workflow: []
            }
          },
          validation: {
            enabled: true,
            methods: [],
            revocationChecking: true,
            trustAnchors: []
          },
          revocation: {
            enabled: true,
            method: 'CRL',
            distribution: {
              crl: {
                enabled: true,
                distributionPoints: [],
                updateFrequency: 'WEEKLY',
                format: 'DER'
              },
              ocsp: {
                enabled: false,
                urls: [],
                signingCertificate: '',
                signingKey: '',
                validUntil: 24
              }
            },
            signing: {
              algorithm: 'SHA256withRSA',
              key: '',
              certificate: '',
              validityPeriod: 24
            }
          }
        },
        encryption: {
          default: {
            algorithm: 'AES-256-GCM',
            keySize: 256,
            mode: 'GCM',
            padding: 'PKCS7'
          },
          data: {
            fields: [],
            policies: [],
            keyDerivation: {
              algorithm: 'PBKDF2',
              iterations: 100000,
              saltLength: 32
            }
          },
          communication: {
            tls: {
              minVersion: '1.2',
              maxVersion: '1.3',
              cipherSuites: [
                'TLS_AES_256_GCM_SHA384',
                'TLS_CHACHA20_POLY1305_SHA256',
                'TLS_AES_128_GCM_SHA256'
              ],
              certificates: []
            },
            protocols: [],
            certificates: []
          },
          storage: {
            enabled: true,
            algorithm: 'AES-256-GCM',
            keyRotation: true,
            compression: true,
            integrity: true
          }
        },
        signing: {
          default: {
            algorithm: 'RSA-4096',
            keySize: 4096,
            padding: 'PKCS1v15',
            digest: 'SHA-256'
          },
          algorithms: [
            {
              name: 'RSA',
              type: 'RSA',
              keySizes: [2048, 3072, 4096],
              enabled: true
            },
            {
              name: 'ECDSA',
              type: 'ECDSA',
              keySizes: [256, 384, 521],
              enabled: true
            },
            {
              name: 'EdDSA',
              type: 'EDDSA',
              keySizes: [25519, 448],
              enabled: true
            }
          ],
          verification: {
            enabled: true,
            methods: [],
            trustAnchors: []
          },
          timestamps: {
            enabled: false,
            authority: {
              url: '',
              certificate: '',
              timeout: 30,
              retryPolicy: {
                maxAttempts: 3,
                backoff: 'EXPONENTIAL',
                delay: 1,
                maxDelay: 60
              }
            },
            format: 'RFC3161'
          }
        },
        compliance: {
          fips: {
            enabled: false,
            mode: 'STRICT',
            validatedModules: [],
            selfTests: true
          },
          nist: {
            standards: ['FIPS-140-2', 'FIPS-140-3'],
            curves: ['P-256', 'P-384', 'P-521'],
            algorithms: ['AES', 'RSA', 'ECDSA', 'SHA-256', 'SHA-384', 'SHA-512'],
            keySizes: [
              { algorithm: 'AES', minSize: 128, recommendedSize: 256, maxSize: 256 },
              { algorithm: 'RSA', minSize: 2048, recommendedSize: 4096, maxSize: 16384 },
              { algorithm: 'ECDSA', minSize: 256, recommendedSize: 384, maxSize: 521 }
            ]
          },
          regulations: []
        }
      },
      audit: {
        enabled: true,
        scope: {
          events: [
            {
              category: 'SECURITY',
              types: ['LOGIN', 'LOGOUT', 'PERMISSION_DENIED', 'POLICY_VIOLATION'],
              severity: ['MEDIUM', 'HIGH', 'CRITICAL']
            }
          ],
          users: {
            include: [],
            exclude: [],
            roles: [],
            privileges: []
          },
          resources: {
            types: [],
            locations: [],
            classifications: []
          },
          actions: [],
          exclusions: []
        },
        retention: {
          default: 2555,
          byType: {
            'SECURITY': 2555,
            'COMPLIANCE': 2555,
            'OPERATIONAL': 1095,
            'DEBUG': 90
          },
          archival: true,
          archivalLocation: '',
          archivalFormat: 'JSON'
        },
        formatting: {
          format: 'JSON',
          fields: [],
          enrichment: {
            enabled: false,
            services: [],
            cacheTTL: 60
          },
          compression: true
        },
        protection: {
          encryption: true,
          signing: true,
          integrity: true,
          access: {
            authentication: true,
            authorization: true,
            roles: ['AUDITOR', 'SECURITY_ADMIN'],
            logging: true
          },
          tamperDetection: true
        }
      },
      marketplace: {
        enabled: true,
        verification: {
          required: true,
          minimumLevel: 'STANDARD',
          automaticRevocation: true,
          frequency: 'WEEKLY'
        },
        scanning: {
          staticAnalysis: {
            enabled: true,
            tools: [],
            rules: [],
            thresholds: []
          },
          dependencyScanning: {
            enabled: true,
            databases: [],
            frequency: 'DAILY',
            remediation: {
              automatic: false,
              patches: false,
              alternatives: true,
              exceptions: []
            }
          },
          containerScanning: {
            enabled: false,
            baseImages: [],
            policies: []
          },
          secretsScanning: {
            enabled: true,
            patterns: [],
            verification: false,
            falsePositiveHandling: {
              autoWhitelist: false,
              threshold: 5,
              reviewRequired: true,
              reporting: true
            }
          }
        },
        certification: {
          levels: [
            {
              name: 'BASIC',
              description: 'Basic security verification',
              requirements: [],
              validity: 365,
              renewal: {
                automatic: true,
                gracePeriod: 30,
                requirements: [],
                process: []
              }
            }
          ],
          process: [],
          auditTrail: true
        },
        reputation: {
          enabled: true,
          sources: [],
          scoring: [],
          display: true
        },
        monitoring: {
          realTime: true,
          alerts: [],
          reporting: []
        }
      }
    };
  }

  private encrypt(data: string): string {
    // Simple encryption - in production, use proper encryption
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private decrypt(encryptedData: string): string {
    // Simple decryption - in production, use proper decryption
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private validateConfiguration(config: SecurityConfiguration): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!config.version) {
      errors.push('Configuration version is required');
    }

    if (!config.frameworks || config.frameworks.length === 0) {
      warnings.push('No security frameworks configured');
    }

    if (!config.policies || config.policies.length === 0) {
      warnings.push('No security policies configured');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export default SecurityConfigurationManager;