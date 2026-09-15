import { useState, useEffect } from 'react';
import { RiskAlert } from '../../types';
import { riskService, PositionSizeResult } from '../../services/riskService';
import { ShieldAlert, Calculator, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';
import { formatNPR, formatPercent, formatNumber } from '../../utils/formatters';

export function RiskView() {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [capital, setCapital] = useState<number>(2000000); // 20 Lakhs NPR
  const [riskPercent, setRiskPercent] = useState<number>(2.0); // 2% risk
  const [entryPrice, setEntryPrice] = useState<number>(548); // CHCL
  const [stopPrice, setStopPrice] = useState<number>(518);
  const [targetPrice, setTargetPrice] = useState<number>(610);
  const [calcResult, setCalcResult] = useState<PositionSizeResult | null>(null);

  useEffect(() => {
    riskService.getActiveRiskAlerts().then(setAlerts);
  }, []);

  useEffect(() => {
    if (capital > 0 && entryPrice > 0 && stopPrice > 0 && entryPrice > stopPrice) {
      const res = riskService.calculatePositionSize(
        capital,
        riskPercent,
        entryPrice,
        stopPrice,
        targetPrice
      );
      setCalcResult(res);
    } else {
      setCalcResult(null);
    }
  }, [capital, riskPercent, entryPrice, stopPrice, targetPrice]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto font-mono text-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span>RISK MANAGEMENT &amp; POSITION SIZING ENGINE</span>
        </h1>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          Capital preservation priority: mathematical trade sizing, stop-loss distance, and portfolio limits
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Position Size Calculator */}
        <div className="bg-[#111722] border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <h2 className="font-bold text-slate-200 text-sm">
              NEPSE Trade Position Sizer (Fixed Fractional Model)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">
                Account Total Capital (NPR)
              </label>
              <input
                type="number"
                value={capital}
                onChange={e => setCapital(Number(e.target.value))}
                step="50000"
                className="w-full bg-[#0c1018] border border-slate-700 rounded px-3 py-2 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">
                Risk Per Trade (%)
              </label>
              <input
                type="number"
                value={riskPercent}
                onChange={e => setRiskPercent(Number(e.target.value))}
                step="0.25"
                min="0.5"
                max="5"
                className="w-full bg-[#0c1018] border border-slate-700 rounded px-3 py-2 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">
                Entry Price (NPR)
              </label>
              <input
                type="number"
                value={entryPrice}
                onChange={e => setEntryPrice(Number(e.target.value))}
                step="1"
                className="w-full bg-[#0c1018] border border-slate-700 rounded px-3 py-2 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1">
                Stop Loss Price (NPR)
              </label>
              <input
                type="number"
                value={stopPrice}
                onChange={e => setStopPrice(Number(e.target.value))}
                step="1"
                className="w-full bg-[#0c1018] border border-slate-700 rounded px-3 py-2 text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 text-[11px] mb-1">
                Target Exit Price (NPR)
              </label>
              <input
                type="number"
                value={targetPrice}
                onChange={e => setTargetPrice(Number(e.target.value))}
                step="1"
                className="w-full bg-[#0c1018] border border-slate-700 rounded px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          {/* Sizing Outputs */}
          {calcResult && (
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="bg-[#0b0f17] p-3 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Recommended Share Size</div>
                  <div className="text-xl font-bold text-cyan-300 mt-0.5">
                    {formatNumber(calcResult.recommendedShares, 0)} Kitta
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Total: {formatNPR(calcResult.totalPositionValue)}
                  </div>
                </div>

                <div className="bg-[#0b0f17] p-3 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Max Capital Risked</div>
                  <div className="text-xl font-bold text-rose-400 mt-0.5">
                    {formatNPR(calcResult.potentialLossAmount)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Stop Distance: -{calcResult.stopDistancePercent.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-[#0b0f17] p-3 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Reward to Risk Ratio</div>
                  <div className="text-xl font-bold text-emerald-400 mt-0.5">
                    {calcResult.riskRewardRatio} : 1
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Potential: +{formatNPR(calcResult.potentialProfitAmount)}
                  </div>
                </div>
              </div>

              {/* Exposure % and warnings */}
              <div className="p-3 bg-[#0b0f17] rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Position Exposure (% of Account):</span>
                <span className="font-bold text-slate-100">{calcResult.portfolioExposurePercent}%</span>
              </div>

              {calcResult.warnings.length > 0 ? (
                <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded space-y-1 text-[11px] text-rose-300">
                  {calcResult.warnings.map((w, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded text-[11px] text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Trade sizing conforms strictly with personal risk parameters (max 2% account risk).</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Active Market & Portfolio Risk Alerts */}
        <div className="bg-[#111722] border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h2 className="font-bold text-slate-200 text-sm">
              Active Risk Alerts &amp; Threshold Breaches ({alerts.length})
            </h2>
          </div>

          <div className="space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className="p-3.5 rounded bg-[#0c1018] border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    {alert.title}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      alert.severity === 'HIGH'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {alert.severity} SEVERITY
                  </span>
                </div>

                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {alert.description}
                </p>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Triggered Value: <strong className="text-cyan-300">{alert.metricValue}</strong></span>
                  <span className="text-slate-400">Threshold: {alert.thresholdValue}</span>
                </div>

                <div className="bg-slate-900/80 p-2 rounded text-[11px] text-slate-300">
                  <strong className="text-cyan-400">Action Protocol:</strong> {alert.actionRecommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
