import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OpportunityStatus = 'Discovered' | 'Shortlisted' | 'Applied' | 'Interviewing' | 'Offer';

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  url?: string;
  rawDescription: string;
  cleanDescription?: string;

  matchScore: number;
  matchPros: string[];
  matchCons: string[];
  coreTags: string[];

  status: OpportunityStatus;
  statusDays: number;

  hiddenAssets: string[];
  frictionPoints: string[];

  resumeTweaks?: string;
  executivePitch?: string;

  createdAt: number;
  updatedAt: number;
}

export interface StrategyAlert {
  id: string;
  type: 'trend' | 'warning' | 'info';
  message: string;
  isRead: boolean;
  createdAt: number;
}

interface AppState {
  opportunities: Opportunity[];
  alerts: StrategyAlert[];
  apiKey: string;

  // Actions
  setApiKey: (key: string) => void;
  addOpportunity: (opp: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt' | 'statusDays'>) => void;
  updateOpportunity: (id: string, updates: Partial<Opportunity>) => void;
  updateOpportunityStatus: (id: string, status: OpportunityStatus) => void;
  deleteOpportunity: (id: string) => void;

  addAlert: (alert: Omit<StrategyAlert, 'id' | 'createdAt' | 'isRead'>) => void;
  markAlertRead: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      opportunities: [],
      alerts: [],
      apiKey: '',

      setApiKey: (key) => set({ apiKey: key }),

      addOpportunity: (opp) => set((state) => ({
        opportunities: [
          ...state.opportunities,
          {
            ...opp,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            statusDays: 0,
          }
        ]
      })),

      updateOpportunity: (id, updates) => set((state) => ({
        opportunities: state.opportunities.map(opp =>
          opp.id === id ? { ...opp, ...updates, updatedAt: Date.now() } : opp
        )
      })),

      updateOpportunityStatus: (id, status) => set((state) => ({
        opportunities: state.opportunities.map(opp =>
          opp.id === id ? { ...opp, status, updatedAt: Date.now(), statusDays: 0 } : opp
        )
      })),

      deleteOpportunity: (id) => set((state) => ({
        opportunities: state.opportunities.filter(opp => opp.id !== id)
      })),

      addAlert: (alert) => set((state) => ({
        alerts: [
          {
            ...alert,
            id: crypto.randomUUID(),
            isRead: false,
            createdAt: Date.now()
          },
          ...state.alerts
        ]
      })),

      markAlertRead: (id) => set((state) => ({
        alerts: state.alerts.map(a =>
          a.id === id ? { ...a, isRead: true } : a
        )
      })),
    }),
    {
      name: 'fintech-exec-radar-storage',
    }
  )
);
