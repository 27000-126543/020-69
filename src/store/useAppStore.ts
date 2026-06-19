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

export const useAppStore = create<AppState>((set, get) => ({
  brands: loadFromStorage('rumor-analyzer-brands', defaultBrands),
  exclusionWords: loadFromStorage('rumor-analyzer-exclusion-words', defaultExclusionWords),
  rumorClues: loadFromStorage('rumor-analyzer-rumor-clues', mockRumorClues),
  spreadNodes: initialSpreadNodes,
  responseSuggestions: loadFromStorage('rumor-analyzer-response-suggestions', mockResponseSuggestions),
  heatData: loadFromStorage('rumor-analyzer-heat-data', mockHeatData),
  selectedRumorId: null,
  selectedNodeId: null,
  teamMembers: defaultTeamMembers,

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
      const updated: Record<string, ResponseSuggestion> = {
        ...state.responseSuggestions,
        [rumorId]: {
          ...suggestion,
          actionItems: suggestion.actionItems.map((item) =>
            item.id === actionItemId ? { ...item, status } : item
          ),
        },
      };
      saveToStorage('rumor-analyzer-response-suggestions', updated);
      return { responseSuggestions: updated };
    }),

  updateNodeAnnotation: (rumorId, nodeId, annotation) =>
    set((state) => {
      const nodeList = state.spreadNodes[rumorId];
      if (!nodeList) return state;
      const updated: Record<string, SpreadNode[]> = {
        ...state.spreadNodes,
        [rumorId]: nodeList.map((node) =>
          node.id === nodeId ? { ...node, annotation } : node
        ),
      };
      saveToStorage('rumor-analyzer-spread-nodes', updated);
      return { spreadNodes: updated };
    }),

  assignRumorTask: (rumorId, assignment) =>
    set((state) => {
      const updated = state.rumorClues.map((c) =>
        c.id === rumorId ? { ...c, assignment } : c
      );
      saveToStorage('rumor-analyzer-rumor-clues', updated);
      return { rumorClues: updated };
    }),

  updateRumorCurrentStep: (rumorId, currentStep) =>
    set((state) => {
      const updated = state.rumorClues.map((c) =>
        c.id === rumorId && c.assignment
          ? { ...c, assignment: { ...c.assignment, currentStep } }
          : c
      );
      saveToStorage('rumor-analyzer-rumor-clues', updated);
      return { rumorClues: updated };
    }),
}));
