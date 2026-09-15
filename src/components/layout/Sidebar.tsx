import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Building2,
  LineChart,
  BarChart3,
  Users,
  Crosshair,
  Eye,
  Briefcase,
  ShieldAlert,
  BookOpen,
  Database,
  Settings,
  ChevronRight,
  Terminal,
  FlaskConical,
  Layers,
  Activity,
  ShieldCheck,
  BrainCircuit,
} from 'lucide-react';

import { DataSourceIndicator } from './DataSourceIndicator';

export type NavSection =
  | 'dashboard'
  | 'market'
  | 'stocks'
  | 'technical'
  | 'backtest'
  | 'features'
  | 'validation'
  | 'state-engine'
  | 'decision-engine'
  | 'fundamental'
  | 'broker'
  | 'setups'
  | 'watchlist'
  | 'portfolio'
  | 'risk'
  | 'research'
  | 'data'
  | 'settings';

interface SidebarProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  detectedSetupsCount?: number;
  activeRiskAlertsCount?: number;
}

export function Sidebar({
  activeSection,
  onNavigate,
  detectedSetupsCount = 4,
  activeRiskAlertsCount = 3,
}: SidebarProps) {
  const navItems: {
    id: NavSection;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    group: 'CORE' | 'ANALYTICAL ENGINES' | 'MANAGEMENT' | 'SYSTEM';
  }[] = [
    // Core Navigation
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'CORE' },
    { id: 'market', label: 'Market Overview', icon: TrendingUp, group: 'CORE' },
    { id: 'stocks', label: 'Stock Research', icon: Building2, group: 'CORE' },

    // Analytical Engines
    { id: 'technical', label: 'Technical Analysis', icon: LineChart, group: 'ANALYTICAL ENGINES' },
    { id: 'backtest', label: 'Historical Backtest Lab', icon: FlaskConical, group: 'ANALYTICAL ENGINES' },
    { id: 'features', label: 'Feature & Probability Lab', icon: Layers, group: 'ANALYTICAL ENGINES' },
    { id: 'validation', label: 'Robustness & Data Quality', icon: ShieldCheck, badge: '3D', group: 'ANALYTICAL ENGINES' },
    { id: 'state-engine', label: 'Current State Engine', icon: Activity, badge: '4A', group: 'ANALYTICAL ENGINES' },
    { id: 'decision-engine', label: 'Decision Intelligence', icon: BrainCircuit, badge: '4B', group: 'ANALYTICAL ENGINES' },
    { id: 'fundamental', label: 'Fundamental Analysis', icon: BarChart3, group: 'ANALYTICAL ENGINES' },
    { id: 'broker', label: 'Broker Analysis', icon: Users, group: 'ANALYTICAL ENGINES' },
    { id: 'setups', label: 'Trading Setups', icon: Crosshair, badge: detectedSetupsCount, group: 'ANALYTICAL ENGINES' },

    // Management & Execution
    { id: 'watchlist', label: 'Watchlist', icon: Eye, group: 'MANAGEMENT' },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase, group: 'MANAGEMENT' },
    { id: 'risk', label: 'Risk Engine', icon: ShieldAlert, badge: activeRiskAlertsCount, group: 'MANAGEMENT' },
    { id: 'research', label: 'Trade Journal', icon: BookOpen, group: 'MANAGEMENT' },

    // System & Data
    { id: 'data', label: 'Data Architecture', icon: Database, group: 'SYSTEM' },
    { id: 'settings', label: 'Settings & Weights', icon: Settings, group: 'SYSTEM' },
  ];

  const groups = ['CORE', 'ANALYTICAL ENGINES', 'MANAGEMENT', 'SYSTEM'] as const;

  return (
    <aside className="w-64 bg-[#0a0e16] border-r border-slate-800/80 flex flex-col shrink-0 h-screen select-none">
      {/* Brand Terminal Identity */}
      <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
          <Terminal className="w-4 h-4" />
        </div>
        <div>
          <div className="font-mono font-bold text-xs tracking-wider text-slate-100 flex items-center gap-1.5">
            NEPSE INTEL <span className="text-[10px] text-cyan-400 font-normal">v1.0</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            Research & Decision System
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {groups.map(group => {
          const items = navItems.filter(item => item.group === group);
          return (
            <div key={group} className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                {group}
              </div>
              {items.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-800/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold leading-none ${
                          item.id === 'risk'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Terminal Architecture Status Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#070a10] space-y-2">
        <DataSourceIndicator variant="pill" className="w-full justify-center text-[10px] py-1" />
        <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-[11px] font-mono">
          <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
            <span>PIPELINE ENGINE</span>
            <span className="text-emerald-400 font-semibold">ACTIVE</span>
          </div>
          <div className="text-[10px] text-slate-400 leading-tight">
            DATA → VAL → CALC → SCORES → RISK
          </div>
          <div className="mt-1 text-[10px] text-cyan-400/80 flex items-center justify-between">
            <span>Deterministic Rules</span>
            <span>100% Traceable</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
