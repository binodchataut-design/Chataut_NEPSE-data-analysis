import React, { useState, useEffect } from 'react';
import { Database, AlertTriangle, CheckCircle2, XCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { ActiveDataState, ProviderStatusInfo } from '../../types/dataInfrastructure';

interface DataSourceIndicatorProps {
  variant?: 'pill' | 'banner' | 'tag';
  className?: string;
  showDetailsOnClick?: boolean;
}

export const DataSourceIndicator: React.FC<DataSourceIndicatorProps> = ({
  variant = 'pill',
  className = '',
  showDetailsOnClick = true,
}) => {
  const [activeState, setActiveState] = useState<ActiveDataState>(dataService.getActiveDataState());
  const [statusInfo, setStatusInfo] = useState<ProviderStatusInfo>(dataService.getProviderStatusInfo());
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      setActiveState(dataService.getActiveDataState());
      setStatusInfo(dataService.getProviderStatusInfo());
    };

    update();
    const unsubscribe = dataService.subscribe(update);
    return () => unsubscribe();
  }, []);

  const handleSwitchToMock = (e: React.MouseEvent) => {
    e.stopPropagation();
    dataService.setMode('MOCK_DATA').catch(err => {
      console.error('[DataSourceIndicator] Failed to switch mode to MOCK_DATA:', err);
    });
  };

  const handleSwitchToReal = (e: React.MouseEvent) => {
    e.stopPropagation();
    dataService.setMode('REAL_DATA').catch(err => {
      console.error('[DataSourceIndicator] Failed to switch mode to REAL_DATA:', err);
    });
  };

  const handleSwitchToSupabase = (e: React.MouseEvent) => {
    e.stopPropagation();
    dataService.setMode('SUPABASE').catch(err => {
      console.error('[DataSourceIndicator] Failed to switch mode to SUPABASE:', err);
    });
  };

  // Tag variant: ultra compact for table headers or card corners
  if (variant === 'tag') {
    if (activeState === 'LIVE_DATA_CONNECTED') {
      return (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 ${className}`}
          title="Data Source: Live NEPSE Feed (Connected)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE_DATA
        </span>
      );
    }
    if (activeState === 'LIVE_DATA_UNAVAILABLE') {
      return (
        <button
          onClick={() => showDetailsOnClick && setIsModalOpen(true)}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-950/60 border border-rose-500/40 text-rose-400 hover:bg-rose-900/50 transition-colors ${className}`}
          title={`Live feed unavailable: ${statusInfo.reason || 'Not connected'}`}
        >
          <XCircle className="w-2.5 h-2.5 text-rose-400" />
          LIVE_UNAVAILABLE
        </button>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-950/60 border border-amber-500/40 text-amber-400 ${className}`}
        title="Data Source: Standardized Mock Data (Simulated)"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        MOCK_DATA
      </span>
    );
  }

  // Banner variant: for top of views when state is unavailable or warning is needed
  if (variant === 'banner') {
    if (activeState === 'LIVE_DATA_UNAVAILABLE') {
      return (
        <div className={`p-3 rounded-lg bg-rose-950/30 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-mono font-bold text-rose-300 mr-2">DATA SOURCE: LIVE_DATA_UNAVAILABLE</span>
              <span className="text-rose-300/80 truncate block sm:inline text-[11px]">
                {statusInfo.reason || 'Live NEPSE exchange connection not configured.'} Never replacing with mock data silently.
              </span>
            </div>
          </div>
          <button
            onClick={handleSwitchToMock}
            className="shrink-0 px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-100 font-mono text-[11px] font-medium border border-rose-400/30 flex items-center gap-1 transition-colors"
          >
            Switch to MOCK_DATA
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      );
    }

    if (activeState === 'MOCK_DATA') {
      return (
        <div className={`p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-mono font-bold text-[11px] text-amber-300">DATA ENVIRONMENT: MOCK_DATA</span>
            <span className="text-amber-400/80 text-[11px] hidden sm:inline">
              (Simulated point-in-time test universe — not live NEPSE trades)
            </span>
          </div>
          <button
            onClick={() => showDetailsOnClick && setIsModalOpen(true)}
            className="text-[11px] font-mono text-amber-400 hover:text-amber-200 underline shrink-0"
          >
            Details
          </button>
        </div>
      );
    }

    return (
      <div className={`p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-mono font-bold text-[11px] text-emerald-300">DATA ENVIRONMENT: LIVE_DATA_CONNECTED</span>
        </div>
      </div>
    );
  }

  // Pill variant (default): used in Header & View toolbars
  return (
    <>
      <button
        onClick={() => showDetailsOnClick && setIsModalOpen(true)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded text-xs font-mono border transition-all ${
          activeState === 'LIVE_DATA_CONNECTED'
            ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
            : activeState === 'LIVE_DATA_UNAVAILABLE'
            ? 'bg-rose-950/50 border-rose-500/40 text-rose-300 hover:bg-rose-900/40'
            : 'bg-amber-950/50 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
        } ${className}`}
        title="Click to view data provider environment details"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            activeState === 'LIVE_DATA_CONNECTED'
              ? 'bg-emerald-400 animate-pulse'
              : activeState === 'LIVE_DATA_UNAVAILABLE'
              ? 'bg-rose-400'
              : 'bg-amber-400'
          }`}
        />
        <span className="font-semibold tracking-wide">
          {activeState === 'LIVE_DATA_CONNECTED' && 'LIVE_DATA: CONNECTED'}
          {activeState === 'LIVE_DATA_UNAVAILABLE' && 'LIVE_DATA: UNAVAILABLE'}
          {activeState === 'MOCK_DATA' && 'MOCK_DATA: SIMULATED'}
        </span>
      </button>

      {/* Modal Dialog with Comprehensive Provider Status */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101622] border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-slate-100 text-sm">Data Source & Environment Integrity</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Current Status Card */}
            <div className="p-3.5 rounded-lg border bg-[#0b0f17] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">ACTIVE STATE</span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                  activeState === 'LIVE_DATA_CONNECTED'
                    ? 'text-emerald-300 bg-emerald-950/40 border-emerald-500/40'
                    : activeState === 'LIVE_DATA_UNAVAILABLE'
                    ? 'text-rose-300 bg-rose-950/40 border-rose-500/40'
                    : 'text-amber-300 bg-amber-950/40 border-amber-500/40'
                }`}>
                  {activeState}
                </span>
              </div>
              <div className="text-xs text-slate-300 font-mono">
                <div className="text-slate-400 text-[11px]">PROVIDER STATUS:</div>
                <div className="text-slate-200 mt-0.5">{statusInfo.providerStatus}</div>
              </div>
              {statusInfo.reason && (
                <div className="text-xs text-rose-300/90 font-mono bg-rose-950/30 p-2 rounded border border-rose-900/50">
                  <div className="text-rose-400 text-[10px] uppercase font-bold">Unavailable Reason:</div>
                  <div className="mt-0.5">{statusInfo.reason}</div>
                </div>
              )}
              <div className="text-[11px] text-slate-500 font-mono">
                TIMESTAMP: {statusInfo.timestamp}
              </div>
            </div>

            {/* Integrity Guarantee */}
            <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-xs">
              <p className="font-semibold flex items-center gap-1.5 text-cyan-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                Zero Silent Fallback Policy
              </p>
              <p className="mt-1 text-[11px] text-cyan-300/80 leading-relaxed">
                When REAL_DATA mode is active, the engine never replaces disconnected live feeds with simulated mock or baseline records. If live connectivity is missing, the system strictly reports STATE UNAVAILABLE to protect trading and backtest validity.
              </p>
            </div>

            {/* Mode Switching Buttons */}
            <div>
              <label className="block text-slate-400 font-mono text-[11px] uppercase tracking-wider mb-2 font-semibold">
                Change Environment
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={handleSwitchToMock}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    dataService.getMode() === 'MOCK_DATA'
                      ? 'bg-amber-500/15 border-amber-500/60 text-amber-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-mono font-bold text-xs">MOCK_DATA</div>
                  <div className="text-[11px] mt-1 opacity-80">
                    Calibrated NEPSE historical sample data for offline testing.
                  </div>
                </button>

                <button
                  onClick={handleSwitchToSupabase}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    dataService.getMode() === 'SUPABASE'
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-mono font-bold text-xs">SUPABASE</div>
                  <div className="text-[11px] mt-1 opacity-80">
                    5-year historical prices & official indices data warehouse.
                  </div>
                </button>

                <button
                  onClick={handleSwitchToReal}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    dataService.getMode() === 'REAL_DATA'
                      ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-mono font-bold text-xs">REAL_DATA</div>
                  <div className="text-[11px] mt-1 opacity-80">
                    Live authenticated broker gateway feed.
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
