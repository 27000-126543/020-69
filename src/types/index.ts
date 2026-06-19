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

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface TaskAssignment {
  assignee: TeamMember;
  deadline: string;
  currentStep: string;
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
  type: string;
  description: string;
  relevance: Relevance;
  linkedNodeId?: string;
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
