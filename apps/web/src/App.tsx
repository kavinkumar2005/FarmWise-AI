import React, { useState, useEffect } from 'react';
import { FarmerRequest, FinalResult, Plan, PipelineProgressEvent } from '@farmwise/agent-core';
import { Language, Persona, ViewMode, LiveStepStatus } from './types/ui.js';
import { checkHealth, executeOrchestration } from './services/api.js';
import { Header } from './components/Header.js';
import { TrustStrip } from './components/TrustStrip.js';
import { SubmissionWizard } from './components/wizard/SubmissionWizard.js';
import { LiveAgentRunView } from './components/live-run/LiveAgentRunView.js';
import { ResultsDashboard } from './components/dashboard/ResultsDashboard.js';
import { AgriChatDrawer } from './components/chat/AgriChatDrawer.js';
import { AdminDashboard } from './components/admin/AdminDashboard.js';

const INITIAL_STEPS: LiveStepStatus[] = [
  {
    stepId: 'step-plan',
    agent: 'planner',
    titleEn: 'Autonomous Plan Drafting & Model Selection',
    titleTa: 'திட்டம் வகுத்தல் & மாதிரி தேர்வு',
    status: 'queued',
    routingReason: 'Cheapest open-weight model for rapid plan structuring'
  },
  {
    stepId: 'step-geo',
    agent: 'geography',
    titleEn: 'Cadastral Boundary Resolution & GPS Containment',
    titleTa: 'நில வரைபடம் & GPS இருப்பிட ஆய்வு',
    status: 'queued',
    routingReason: 'Cheapest open-weight Bedrock Ministral for GIS turf analysis'
  },
  {
    stepId: 'step-land',
    agent: 'landRecord',
    titleEn: 'Patta Chitta Verification & PII Protection',
    titleTa: 'பட்டா சரிபார்ப்பு & தனிநபர் தரவு பாதுகாப்பு',
    status: 'queued',
    routingReason: 'Strict regex extraction and deterministic PII masking'
  },
  {
    stepId: 'step-image',
    agent: 'image',
    titleEn: 'Multimodal Crop & Disease Vision Analysis',
    titleTa: 'பயிர் & நோய் புகைப்பட பகுப்பாய்வு',
    status: 'queued',
    routingReason: 'Titan Multimodal kNN pass with Gemini Flash escalation'
  },
  {
    stepId: 'step-weather',
    agent: 'weather',
    titleEn: 'Live Open-Meteo Weather & 48h Spray Window',
    titleTa: 'வானிலை முன்னறிவிப்பு & மருந்து தெளிப்பு நேரம்',
    status: 'queued',
    routingReason: 'REST sync with 30-min TTL and agronomic risk heuristics'
  },
  {
    stepId: 'step-agri',
    agent: 'agriKnowledge',
    titleEn: 'TNAU Grounded Agronomy & Fertilizer Prescription',
    titleTa: 'தமிழ்நாடு வேளாண்மைப் பல்கலைக்கழக உரப் பரிந்துரை',
    status: 'queued',
    routingReason: 'Titan Text Embeddings V2 vector search across verified corpus'
  },
  {
    stepId: 'step-verifier',
    agent: 'verifier',
    titleEn: '7-Point Domain Sanity & Claude Critic Audit',
    titleTa: '7 கட்ட கள சரிபார்ப்பு & தணிக்கை',
    status: 'queued',
    routingReason: 'Frontier Claude 3.5 Sonnet reserved for independent verifier audit'
  }
];

export default function App() {
  const [lang, setLang] = useState<Language>('ta');
  const [persona, setPersona] = useState<Persona>('farmer');
  const [activeView, setActiveView] = useState<ViewMode>('wizard');
  const [health, setHealth] = useState<any>(null);

  // Active Execution State
  const [currentRequest, setCurrentRequest] = useState<FarmerRequest | null>(null);
  const [runId, setRunId] = useState<string>('RUN-INIT');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [stepStatuses, setStepStatuses] = useState<LiveStepStatus[]>(INITIAL_STEPS);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<string[] | undefined>(undefined);
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);

  useEffect(() => {
    checkHealth().then(data => setHealth(data));
  }, []);

  // Submit request from wizard
  const handleSubmit = async (request: FarmerRequest) => {
    setCurrentRequest(request);
    setIsRunning(true);
    setActiveView('running');
    setClarifyingQuestions(undefined);

    // Initialize clean steps
    const activeSteps: LiveStepStatus[] = INITIAL_STEPS.map(s => ({
      ...s,
      status: 'queued',
      modelUsed: undefined,
      latencyMs: undefined,
      costUsd: undefined,
      dataSummary: undefined
    }));
    setStepStatuses(activeSteps);

    try {
      const result = await executeOrchestration(request, (evt: PipelineProgressEvent) => {
        setStepStatuses(prev =>
          prev.map(s => {
            if (s.agent === evt.agent) {
              return {
                ...s,
                status: evt.status === 'started' ? 'running' : 'completed',
                modelUsed: evt.modelUsed || s.modelUsed,
                latencyMs: evt.latencyMs,
                costUsd: evt.costUsd,
                dataSummary: evt.data
                  ? typeof evt.data === 'string'
                    ? evt.data
                    : JSON.stringify(evt.data).substring(0, 75) + '...'
                  : undefined
              };
            }
            return s;
          })
        );
      });

      setRunId(result.runId);
      setPlan(result.plan);

      if (result.status === 'NEEDS_CLARIFICATION') {
        setClarifyingQuestions(result.clarifyingQuestions);
        setIsRunning(false);
      } else if (result.status === 'COMPLETED' && result.finalResult) {
        // Mark all steps as complete
        setStepStatuses(prev =>
          prev.map(s => ({
            ...s,
            status: 'completed',
            modelUsed: s.modelUsed || (s.agent === 'verifier' ? 'claude-3-5-sonnet' : s.agent === 'image' ? 'gemini-1.5-flash' : 'ministral-8b')
          }))
        );

        setFinalResult(result.finalResult);
        setIsRunning(false);
      }
    } catch (err: any) {
      console.error('Execution error:', err);
      setIsRunning(false);
    }
  };

  // Clarification loop handler
  const handleClarify = (answer: { surveyNumber: string; village: string }) => {
    if (!currentRequest) return;
    const updated: FarmerRequest = {
      ...currentRequest,
      surveyNumber: answer.surveyNumber,
      village: answer.village,
      district: currentRequest.district || 'Tenkasi',
      taluk: currentRequest.taluk || 'Sivagiri'
    };
    handleSubmit(updated);
  };

  // Return to wizard for a new analysis
  const handleNewAnalysis = () => {
    setActiveView('wizard');
    setFinalResult(null);
    setClarifyingQuestions(undefined);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9F4] text-gray-900 font-sans selection:bg-[#2E7D32] selection:text-white">
      {/* App Header */}
      <Header
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'ta' : 'en')}
        persona={persona}
        onTogglePersona={() => setPersona(persona === 'farmer' ? 'officer' : 'farmer')}
        health={health}
        activeView={activeView}
        onSelectView={view => setActiveView(view)}
        hasResults={!!finalResult}
        isRunning={isRunning}
      />

      {/* Trust & Provenance Strip */}
      <TrustStrip lang={lang} />

      {/* Main Dynamic View Area */}
      <main className="flex-1 w-full pb-12">
        {activeView === 'wizard' && (
          <SubmissionWizard
            lang={lang}
            onSubmit={handleSubmit}
            isSubmitting={isRunning}
          />
        )}

        {activeView === 'running' && (
          <LiveAgentRunView
            lang={lang}
            runId={runId}
            plan={plan}
            stepStatuses={stepStatuses}
            isRunning={isRunning}
            clarifyingQuestions={clarifyingQuestions}
            onClarify={handleClarify}
            onViewResults={() => setActiveView('results')}
            costComparison={
              finalResult?.costSummary
                ? {
                    routedCostUSD: finalResult.costSummary.actualRoutedCostUSD,
                    baselineCostUSD: finalResult.costSummary.allLargeModelCostUSD,
                    savingsPct: finalResult.costSummary.savingsPct
                  }
                : undefined
            }
          />
        )}

        {activeView === 'results' && finalResult && (
          <ResultsDashboard
            result={finalResult}
            lang={lang}
            persona={persona}
            onNewAnalysis={handleNewAnalysis}
          />
        )}

        {activeView === 'admin' && (
          <AdminDashboard lang={lang} />
        )}
      </main>

      {/* Global Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500 space-y-1">
        <div className="font-semibold text-gray-700">
          FarmwiseAI Campus Product Challenge — Task 1: Multi-Model, Multimodal & Agentic AI Platform
        </div>
        <div className="text-[11px] text-gray-400 font-mono">
          Region: ap-south-1 (Mumbai) • Lambda: FAI-TCE-LambdaExecutionRole • Bedrock Ministral + Titan + Gemini + Claude
        </div>
      </footer>

      {/* Persistent Floating Agri AI Chat Drawer */}
      <AgriChatDrawer
        currentResult={finalResult}
        lang={lang}
        persona={persona}
      />
    </div>
  );
}