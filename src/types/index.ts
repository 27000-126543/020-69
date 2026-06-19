export interface BrandProfile {
  id: string;
  brandName: string;
  productNames: string[];
  storeCities: string[];
  commonMisnomers: string[];
}

export interface ExclusionWord {
  id: string;
  word: string;
  category: string;
}

export type RiskLevel = 'high' | 'medium' | 'low';
export type RumorCategory = 'unknown_source_fast_spread' | 'old_content_repackaged' | 'competitor_topic_embedded' | 'other';
export type NodeType = 'small_circle' | 'marketing_account' | 'local_community' | 'mainstream_media' | 'official_response';
export type ActionStatus = 'pending' | 'in_progress' | 'completed';
export type Priority = 'urgent' | 'high' | 'normal';
export type Relevance = 'high' | 'medium' | 'low';
export type NodeAnnotation = 'none' | 'collected' | 'reported' | 'pending_verify';
export type CollaboratorRole = 'owner' | 'evidence' | 'platform' | 'legal' | 'copywriter' | 'monitor';
export type ActionType =
  | 'action_status_change'
  | 'node_annotation_change'
  | 'task_assignment'
  | 'task_step_change'
  | 'evidence_added'
  | 'evidence_status_change'
  | 'report_exported';
export type MaterialKind = 'screenshot' | 'link' | 'report' | 'receipt' | 'video' | 'document' | 'other';
export type MaterialAvailability = 'available' | 'pending_upload' | 'expired' | 'archived';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Collaborator extends TeamMember {
  collaborationRole: CollaboratorRole;
}

export interface TaskAssignment {
  assignee: TeamMember;
  deadline: string;
  currentStep: string;
  collaborators?: Collaborator[];
}

export interface ActionLog {
  id: string;
  rumorId: string;
  actionType: ActionType;
  operatorId: string;
  operatorName: string;
  timestamp: string;
  description: string;
  relatedItemId?: string;
  previousValue?: string;
  newValue?: string;
}

export interface RumorClue {
  id: string;
  summary: string;
  sourcePlatform: string;
  repostCount: number;
  firstSeenAt: string;
  riskLevel: RiskLevel;
  category: RumorCategory;
  brandId: string;
  relatedProductName: string;
  detail: string;
  assignment?: TaskAssignment;
}

export interface AudienceProfile {
  ageDistribution: { range: string; percentage: number }[];
  topRegions: string[];
  interestTags: string[];
}

export interface SpreadNode {
  id: string;
  rumorId: string;
  timestamp: string;
  nodeType: NodeType;
  title: string;
  screenshotUrl: string;
  linkUrl: string;
  heatValue: number;
  previousHeatValue: number;
  audienceProfile: AudienceProfile;
  description: string;
  annotation?: NodeAnnotation;
}

export interface PlatformAccount {
  platform: string;
  accountName: string;
  contactInfo: string;
  priority: Priority;
}

export interface CustomerServiceScript {
  keyPoint: string;
  detail: string;
}

export interface EvidenceMaterial {
  id: string;
  type: string;
  description: string;
  relevance: Relevance;
  linkedNodeId?: string;
  kind: MaterialKind;
  collectedBy?: string;
  collectedByName?: string;
  collectedAt?: string;
  availability: MaterialAvailability;
  fileUrl?: string;
}

export interface ActionItem {
  id: string;
  content: string;
  status: ActionStatus;
}

export interface ResponseSuggestion {
  id: string;
  rumorId: string;
  platformAccounts: PlatformAccount[];
  customerServiceScripts: CustomerServiceScript[];
  evidenceMaterials: EvidenceMaterial[];
  actionItems: ActionItem[];
}

export interface HeatDataPoint {
  time: string;
  heat: number;
  event?: string;
}
