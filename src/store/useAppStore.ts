import { create } from 'zustand';
import type {
  BrandProfile,
  ExclusionWord,
  RumorClue,
  SpreadNode,
  ResponseSuggestion,
  HeatDataPoint,
  ActionStatus,
  NodeAnnotation,
  TaskAssignment,
  TeamMember,
  EvidenceMaterial,
  ActionLog,
  ActionType,
  MaterialKind,
  MaterialAvailability,
  Relevance,
} from '@/types';
import {
  defaultBrands,
  defaultExclusionWords,
  mockRumorClues,
  mockSpreadNodes,
  mockResponseSuggestions,
  mockHeatData,
} from '@/data/mockData';

export const defaultTeamMembers: TeamMember[] = [
  { id: 'member-1', name: '陈思远', role: '公关主管', avatar: 'C' },
  { id: 'member-2', name: '林雨晴', role: '品牌专员', avatar: 'L' },
  { id: 'member-3', name: '王浩然', role: '法务联络', avatar: 'W' },
  { id: 'member-4', name: '周晓彤', role: '社媒运营', avatar: 'Z' },
  { id: 'member-5', name: '刘志强', role: '危机处理', avatar: 'L' },
];

export const collaboratorRoleLabels: Record<string, string> = {
  owner: '主负责人',
  evidence: '证据采集',
  platform: '平台对接',
  legal: '法务支撑',
  copywriter: '文案撰稿',
  monitor: '舆情监测',
};

const nowStr = () => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const d = new Date('2026-06-20T16:00:00');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const materialKindMap: Record<string, MaterialKind> = {
  截图: 'screenshot',
  链接: 'link',
  检测: 'report',
  检测报告: 'report',
  投诉: 'receipt',
  回执: 'receipt',
  视频: 'video',
  文档: 'document',
  凭证: 'screenshot',
};

const nodeKindLinkSuggest: Record<string, string> = {
  screenshot: 'screenshotUrl',
  link: 'linkUrl',
};

const detectKind = (type: string): MaterialKind => {
  for (const key of Object.keys(materialKindMap)) {
    if (type.includes(key)) return materialKindMap[key];
  }
  return 'other';
};

const availabilityByKind: Record<MaterialKind, MaterialAvailability> = {
  screenshot: 'available',
  link: 'available',
  report: 'pending_upload',
  receipt: 'pending_upload',
  video: 'available',
  document: 'archived',
  other: 'available',
};

const relevanceByKind: Record<MaterialKind, Relevance> = {
  screenshot: 'high',
  link: 'medium',
  report: 'high',
  receipt: 'medium',
  video: 'high',
  document: 'low',
  other: 'medium',
};

const normalizeSpreadNodes = (nodes: Record<string, SpreadNode[]>): Record<string, SpreadNode[]> => {
  const result: Record<string, SpreadNode[]> = {};
  Object.entries(nodes).forEach(([rumorId, list]) => {
    result[rumorId] = list.map((node) => ({
      ...node,
      annotation: node.annotation || 'none',
    }));
  });
  return result;
};

const normalizeEvidenceMaterials = (
  suggestions: Record<string, ResponseSuggestion>,
  nodes: Record<string, SpreadNode[]>
): Record<string, ResponseSuggestion> => {
  const result: Record<string, ResponseSuggestion> = {};
  Object.entries(suggestions).forEach(([rumorId, sug]) => {
    const rumorNodes = nodes[rumorId] || [];
    const collected = new Set<string>();
    const mats: EvidenceMaterial[] = sug.evidenceMaterials.map((raw, idx) => {
      const kind = (raw as any).kind || detectKind(raw.type);
      const linkedNodeId = (raw as any).linkedNodeId || autoPickNodeId(raw, rumorNodes, idx, collected);
      if (linkedNodeId) collected.add(linkedNodeId);
      const collectedBy = (raw as any).collectedBy || (kind === 'screenshot' || kind === 'video' ? 'member-2' : kind === 'report' ? 'member-3' : 'member-4');
      const cm = defaultTeamMembers.find((m) => m.id === collectedBy) || defaultTeamMembers[0];
      return {
        id: (raw as any).id || `ev-${rumorId}-${idx}`,
        type: raw.type,
        description: raw.description,
        relevance: raw.relevance || relevanceByKind[kind],
        linkedNodeId,
        kind,
        collectedBy,
        collectedByName: (raw as any).collectedByName || cm?.name,
        collectedAt: (raw as any).collectedAt || '2026-06-19 15:30',
        availability: (raw as any).availability || availabilityByKind[kind],
        fileUrl: (raw as any).fileUrl,
      };
    });
    result[rumorId] = { ...sug, evidenceMaterials: mats };
  });
  return result;
};

function autoPickNodeId(
  raw: EvidenceMaterial,
  nodes: SpreadNode[],
  idx: number,
  collected: Set<string>
): string | undefined {
  if (nodes.length === 0) return undefined;
  const kind = detectKind(raw.type);
  let ordered: SpreadNode[] = [];
  if (kind === 'screenshot') ordered = nodes.filter((n) => n.nodeType === 'marketing_account' || n.nodeType === 'local_community');
  else if (kind === 'link') ordered = [...nodes].reverse();
  else if (kind === 'report') ordered = nodes.filter((n) => n.nodeType === 'small_circle');
  else if (kind === 'receipt') ordered = nodes.filter((n) => n.nodeType === 'official_response' || n.nodeType === 'mainstream_media');
  if (ordered.length === 0) ordered = [...nodes];
  const candidate = ordered.find((n) => !collected.has(n.id));
  return (candidate || ordered[idx % ordered.length])?.id;
}

const buildInitialActionLogs = (
  clues: RumorClue[],
  suggestions: Record<string, ResponseSuggestion>,
  nodes: Record<string, SpreadNode[]>
): ActionLog[] => {
  const logs: ActionLog[] = [];
  clues.forEach((c) => {
    logs.push({
      id: uid(),
      rumorId: c.id,
      actionType: 'task_assignment',
      operatorId: 'system',
      operatorName: '系统监测',
      timestamp: c.firstSeenAt,
      description: `监测到谣言线索，首次发现于 ${c.sourcePlatform}`,
      relatedItemId: c.id,
    });
    const mats = suggestions[c.id]?.evidenceMaterials || [];
    mats.forEach((m) => {
      logs.push({
        id: uid(),
        rumorId: c.id,
        actionType: 'evidence_added',
        operatorId: m.collectedBy || 'member-2',
        operatorName: m.collectedByName || '林雨晴',
        timestamp: m.collectedAt || '2026-06-19 15:30',
        description: `采集证据材料：${m.type} - ${m.description.slice(0, 30)}`,
        relatedItemId: m.id,
      });
    });
    const cNodes = nodes[c.id] || [];
    cNodes.forEach((n) => {
      if (n.annotation && n.annotation !== 'none') {
        logs.push({
          id: uid(),
          rumorId: c.id,
          actionType: 'node_annotation_change',
          operatorId: 'member-2',
          operatorName: '林雨晴',
          timestamp: n.timestamp,
          description: `节点「${n.title}」标注为 ${annLabel(n.annotation)}`,
          relatedItemId: n.id,
          newValue: n.annotation,
        });
      }
    });
  });
  return logs;
};

const annLabel = (a: NodeAnnotation) =>
  ({ none: '未标注', collected: '已取证', reported: '已投诉', pending_verify: '待核验' }[a]);

const statusLabel = (s: ActionStatus) => ({ pending: '未开始', in_progress: '进行中', completed: '已完成' }[s]);

interface AppState {
  brands: BrandProfile[];
  exclusionWords: ExclusionWord[];
  rumorClues: RumorClue[];
  spreadNodes: Record<string, SpreadNode[]>;
  responseSuggestions: Record<string, ResponseSuggestion>;
  heatData: Record<string, HeatDataPoint[]>;
  selectedRumorId: string | null;
  selectedNodeId: string | null;
  teamMembers: TeamMember[];
  actionLogs: ActionLog[];

  addBrand: (brand: BrandProfile) => void;
  updateBrand: (id: string, brand: Partial<BrandProfile>) => void;
  removeBrand: (id: string) => void;
  addExclusionWord: (word: ExclusionWord) => void;
  removeExclusionWord: (id: string) => void;
  selectRumor: (id: string | null) => void;
  selectNode: (id: string | null) => void;

  updateActionItemStatus: (rumorId: string, actionItemId: string, status: ActionStatus) => void;
  updateNodeAnnotation: (rumorId: string, nodeId: string, annotation: NodeAnnotation) => void;
  assignRumorTask: (rumorId: string, assignment: TaskAssignment) => void;
  updateRumorCurrentStep: (rumorId: string, currentStep: string) => void;
  addActionLog: (log: Omit<ActionLog, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  updateMaterialAvailability: (rumorId: string, materialId: string, availability: MaterialAvailability) => void;
}

const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
};

const saveToStorage = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
};

const initialSpreadNodes = normalizeSpreadNodes(
  loadFromStorage('rumor-analyzer-spread-nodes', mockSpreadNodes)
);

const initialResponseSuggestions = normalizeEvidenceMaterials(
  loadFromStorage('rumor-analyzer-response-suggestions', mockResponseSuggestions),
  initialSpreadNodes
);

const initialRumorClues: RumorClue[] = loadFromStorage('rumor-analyzer-rumor-clues', mockRumorClues);

const initialActionLogs: ActionLog[] = loadFromStorage('rumor-analyzer-action-logs', null as any) ||
  buildInitialActionLogs(initialRumorClues, initialResponseSuggestions, initialSpreadNodes);

export const useAppStore = create<AppState>((set, get) => ({
  brands: loadFromStorage('rumor-analyzer-brands', defaultBrands),
  exclusionWords: loadFromStorage('rumor-analyzer-exclusion-words', defaultExclusionWords),
  rumorClues: initialRumorClues,
  spreadNodes: initialSpreadNodes,
  responseSuggestions: initialResponseSuggestions,
  heatData: loadFromStorage('rumor-analyzer-heat-data', mockHeatData),
  selectedRumorId: null,
  selectedNodeId: null,
  teamMembers: defaultTeamMembers,
  actionLogs: initialActionLogs,

  addBrand: (brand) =>
    set((state) => {
      const brands = [...state.brands, brand];
      saveToStorage('rumor-analyzer-brands', brands);
      return { brands };
    }),

  updateBrand: (id, updates) =>
    set((state) => {
      const brands = state.brands.map((b) => (b.id === id ? { ...b, ...updates } : b));
      saveToStorage('rumor-analyzer-brands', brands);
      return { brands };
    }),

  removeBrand: (id) =>
    set((state) => {
      const brands = state.brands.filter((b) => b.id !== id);
      saveToStorage('rumor-analyzer-brands', brands);
      return { brands };
    }),

  addExclusionWord: (word) =>
    set((state) => {
      const exclusionWords = [...state.exclusionWords, word];
      saveToStorage('rumor-analyzer-exclusion-words', exclusionWords);
      return { exclusionWords };
    }),

  removeExclusionWord: (id) =>
    set((state) => {
      const exclusionWords = state.exclusionWords.filter((w) => w.id !== id);
      saveToStorage('rumor-analyzer-exclusion-words', exclusionWords);
      return { exclusionWords };
    }),

  selectRumor: (id) => set({ selectedRumorId: id, selectedNodeId: null }),

  selectNode: (id) => set({ selectedNodeId: id }),

  updateActionItemStatus: (rumorId, actionItemId, status) =>
    set((state) => {
      const suggestion = state.responseSuggestions[rumorId];
      if (!suggestion) return state;
      const item = suggestion.actionItems.find((i) => i.id === actionItemId);
      const updated: Record<string, ResponseSuggestion> = {
        ...state.responseSuggestions,
        [rumorId]: {
          ...suggestion,
          actionItems: suggestion.actionItems.map((it) =>
            it.id === actionItemId ? { ...it, status } : it
          ),
        },
      };
      saveToStorage('rumor-analyzer-response-suggestions', updated);
      const clue = state.rumorClues.find((c) => c.id === rumorId);
      const op = clue?.assignment?.assignee || defaultTeamMembers[0];
      const newLogs = [
        ...state.actionLogs,
        {
          id: uid(),
          rumorId,
          actionType: 'action_status_change' as ActionType,
          operatorId: op.id,
          operatorName: op.name,
          timestamp: nowStr(),
          description: `任务「${item?.content?.slice(0, 30) || actionItemId}」变更为 ${statusLabel(status)}`,
          relatedItemId: actionItemId,
          previousValue: item?.status,
          newValue: status,
        },
      ];
      saveToStorage('rumor-analyzer-action-logs', newLogs);
      return { responseSuggestions: updated, actionLogs: newLogs };
    }),

  updateNodeAnnotation: (rumorId, nodeId, annotation) =>
    set((state) => {
      const nodeList = state.spreadNodes[rumorId];
      if (!nodeList) return state;
      const node = nodeList.find((n) => n.id === nodeId);
      const prev = node?.annotation || 'none';
      const updated: Record<string, SpreadNode[]> = {
        ...state.spreadNodes,
        [rumorId]: nodeList.map((n) =>
          n.id === nodeId ? { ...n, annotation } : n
        ),
      };
      saveToStorage('rumor-analyzer-spread-nodes', updated);
      const clue = state.rumorClues.find((c) => c.id === rumorId);
      const op = clue?.assignment?.assignee || defaultTeamMembers[1];
      const newLogs = [
        ...state.actionLogs,
        {
          id: uid(),
          rumorId,
          actionType: 'node_annotation_change' as ActionType,
          operatorId: op.id,
          operatorName: op.name,
          timestamp: nowStr(),
          description: `节点「${node?.title || nodeId}」标注由 ${annLabel(prev)} 变更为 ${annLabel(annotation)}`,
          relatedItemId: nodeId,
          previousValue: prev,
          newValue: annotation,
        },
      ];
      saveToStorage('rumor-analyzer-action-logs', newLogs);
      return { spreadNodes: updated, actionLogs: newLogs };
    }),

  assignRumorTask: (rumorId, assignment) =>
    set((state) => {
      const prev = state.rumorClues.find((c) => c.id === rumorId)?.assignment;
      const updated = state.rumorClues.map((c) =>
        c.id === rumorId ? { ...c, assignment } : c
      );
      saveToStorage('rumor-analyzer-rumor-clues', updated);
      const collabText = (assignment.collaborators || [])
        .map((c) => `${c.name}(${collaboratorRoleLabels[c.collaborationRole] || c.collaborationRole})`)
        .join('、');
      const newLogs = [
        ...state.actionLogs,
        {
          id: uid(),
          rumorId,
          actionType: 'task_assignment' as ActionType,
          operatorId: 'member-1',
          operatorName: '陈思远',
          timestamp: nowStr(),
          description: prev
            ? `调整任务：主负责人 ${assignment.assignee.name}，截止 ${assignment.deadline}，当前步骤 ${assignment.currentStep}${collabText ? `，协助人 ${collabText}` : ''}`
            : `分配任务：主负责人 ${assignment.assignee.name}，截止 ${assignment.deadline}，当前步骤 ${assignment.currentStep}${collabText ? `，协助人 ${collabText}` : ''}`,
          relatedItemId: rumorId,
          newValue: assignment.assignee.id,
        },
      ];
      saveToStorage('rumor-analyzer-action-logs', newLogs);
      return { rumorClues: updated, actionLogs: newLogs };
    }),

  updateRumorCurrentStep: (rumorId, currentStep) =>
    set((state) => {
      const clue = state.rumorClues.find((c) => c.id === rumorId);
      const prev = clue?.assignment?.currentStep;
      const updated = state.rumorClues.map((c) =>
        c.id === rumorId && c.assignment
          ? { ...c, assignment: { ...c.assignment, currentStep } }
          : c
      );
      saveToStorage('rumor-analyzer-rumor-clues', updated);
      const op = clue?.assignment?.assignee || defaultTeamMembers[0];
      const newLogs = prev === currentStep ? state.actionLogs : [
        ...state.actionLogs,
        {
          id: uid(),
          rumorId,
          actionType: 'task_step_change' as ActionType,
          operatorId: op.id,
          operatorName: op.name,
          timestamp: nowStr(),
          description: `处置步骤由「${prev}」推进到「${currentStep}」`,
          relatedItemId: rumorId,
          previousValue: prev,
          newValue: currentStep,
        },
      ];
      if (prev !== currentStep) saveToStorage('rumor-analyzer-action-logs', newLogs);
      return { rumorClues: updated, actionLogs: newLogs };
    }),

  addActionLog: (log) =>
    set((state) => {
      const newLogs = [
        ...state.actionLogs,
        { id: uid(), timestamp: log.timestamp || nowStr(), ...log },
      ];
      saveToStorage('rumor-analyzer-action-logs', newLogs);
      return { actionLogs: newLogs };
    }),

  updateMaterialAvailability: (rumorId, materialId, availability) =>
    set((state) => {
      const suggestion = state.responseSuggestions[rumorId];
      if (!suggestion) return state;
      const mat = suggestion.evidenceMaterials.find((m) => m.id === materialId);
      const prev = mat?.availability;
      const updated: Record<string, ResponseSuggestion> = {
        ...state.responseSuggestions,
        [rumorId]: {
          ...suggestion,
          evidenceMaterials: suggestion.evidenceMaterials.map((m) =>
            m.id === materialId ? { ...m, availability } : m
          ),
        },
      };
      saveToStorage('rumor-analyzer-response-suggestions', updated);
      const clue = state.rumorClues.find((c) => c.id === rumorId);
      const op = clue?.assignment?.assignee || defaultTeamMembers[0];
      const availLabel: Record<MaterialAvailability, string> = {
        available: '可用',
        pending_upload: '待上传',
        expired: '已过期',
        archived: '已归档',
      };
      const newLogs = prev === availability ? state.actionLogs : [
        ...state.actionLogs,
        {
          id: uid(),
          rumorId,
          actionType: 'evidence_status_change' as ActionType,
          operatorId: op.id,
          operatorName: op.name,
          timestamp: nowStr(),
          description: `证据「${mat?.type || materialId}」状态由 ${availLabel[prev || 'available']} 变更为 ${availLabel[availability]}`,
          relatedItemId: materialId,
          previousValue: prev,
          newValue: availability,
        },
      ];
      if (prev !== availability) saveToStorage('rumor-analyzer-action-logs', newLogs);
      return { responseSuggestions: updated, actionLogs: newLogs };
    }),
}));
