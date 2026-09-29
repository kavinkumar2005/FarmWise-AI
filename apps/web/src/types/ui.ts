import { FarmerRequest, FinalResult, Plan } from '@farmwise/agent-core';

export type Language = 'en' | 'ta';
export type Persona = 'farmer' | 'officer';
export type ViewMode = 'wizard' | 'running' | 'results' | 'admin';
export type DashboardTab = 'summary' | 'map' | 'advisory' | 'evidence' | 'costs' | 'report';

export interface PresetScenario {
  id: string;
  titleEn: string;
  titleTa: string;
  badge: string;
  descriptionEn: string;
  descriptionTa: string;
  request: FarmerRequest;
}

export interface LiveStepStatus {
  stepId: string;
  agent: string;
  titleEn: string;
  titleTa: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'escalated';
  modelUsed?: string;
  routingReason?: string;
  latencyMs?: number;
  costUsd?: number;
  confidence?: number;
  dataSummary?: string;
}
