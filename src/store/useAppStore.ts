import { create } from 'zustand';
import type {
  BrandProfile,
  ExclusionWord,
  RumorClue,
  SpreadNode,
  ResponseSuggestion,
  HeatDataPoint,
  ActionStatus,
} from '@/types';
import {
  defaultBrands,
  defaultExclusionWords,
  mockRumorClues,
  mockSpreadNodes,
  mockResponseSuggestions,
  mockHeatData,
} from '@/data/mockData';

interface AppState {
  brands: BrandProfile[];
  exclusionWords: ExclusionWord[];
  rumorClues: RumorClue[];
  spreadNodes: Record<string, SpreadNode[]>;
  responseSuggestions: Record<string, ResponseSuggestion>;
  heatData: Record<string, HeatDataPoint[]>;
  selectedRumorId: string | null;
  selectedNodeId: string | null;

  addBrand: (brand: BrandProfile) => void;
  updateBrand: (id: string, brand: Partial<BrandProfile>) => void;
  removeBrand: (id: string) => void;
  addExclusionWord: (word: ExclusionWord) => void;
  removeExclusionWord: (id: string) => void;
  selectRumor: (id: string | null) => void;
  selectNode: (id: string | null) => void;
  updateActionItemStatus: (rumorId: string, actionItemId: string, status: ActionStatus) => void;
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

export const useAppStore = create<AppState>((set) => ({
  brands: loadFromStorage('rumor-analyzer-brands', defaultBrands),
  exclusionWords: loadFromStorage('rumor-analyzer-exclusion-words', defaultExclusionWords),
  rumorClues: mockRumorClues,
  spreadNodes: mockSpreadNodes,
  responseSuggestions: mockResponseSuggestions,
  heatData: mockHeatData,
  selectedRumorId: null,
  selectedNodeId: null,

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
      return { responseSuggestions: updated };
    }),
}));
