import { useState, useEffect } from 'react';
import { BrokerActivity, StockBrokerConcentration } from '../../types';
import { brokerService } from '../../services/brokerService';
import { Users, TrendingUp, TrendingDown, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatNepseDenomination, formatNumber } from '../../utils/formatters';

export function BrokerAnalysisView({ onSelectStock }: { onSelectStock: (symbol: string) => void }) {
  const [brokers, setBrokers] = useState<BrokerActivity[]>([]);
  const [activeScrip, setActiveScrip] = useState<string>('CHCL');
  const [scripConcentration, setScripConcentration] = useState<StockBrokerConcentration | null>(null);

  useEffect(() => {
    brokerService.getTopBrokers().then(setBrokers);
  }, []);

  useEffect(() => {
    brokerService.getStockBrokerConcentration(activeScrip).then(setScripConcentration);
  }, [activeScrip]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto font-mono text-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span>FLOOR BROKER INTELLIGENCE &amp; CONCENTRATION TRACKER</span>
        </h1>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          Floor sheet tracking: institutional accumulation, distribution, and top buyer/seller brokers
        </p>
      </div>

      {/* Stock-wise Broker Concentration Spotlight */}
      <div className="bg-[#111722] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 mb-4 gap-2">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 uppercase text-[11px]">Scrip Floor Concentration:</span>
            <div className="flex items-center gap-1.5">
              {['CHCL', 'NABIL', 'SHIVM', 'UPPER', 'HDL'].map(sym => (
                <button
                  key={sym}
                  onClick={() => setActiveScrip(sym)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                    activeScrip === sym ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {scripConcentration && (
            <span className="px-2.5 py-1 rounded bg-purple-950 border border-purple-800 text-purple-300 font-bold">
              STATUS: {scripConcentration.institutionalAccumulationStatus}
            </span>
          )}
        </div>

        {scripConcentration && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0c1018] p-3 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase">Top 5 Buyer Concentration</span>
              <div className="text-xl font-bold text-cyan-300 mt-1">
                {scripConcentration.top5BuyerSharePercent}%
              </div>
              <span className="text-[10px] text-slate-400">Broker #{scripConcentration.topBuyerBroker} Leader</span>
            </div>

            <div className="bg-[#0c1018] p-3 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase">Top 5 Seller Concentration</span>
              <div className="text-xl font-bold text-rose-400 mt-1">
                {scripConcentration.top5SellerSharePercent}%
              </div>
              <span className="text-[10px] text-slate-400">Broker #{scripConcentration.topSellerBroker} Leader</span>
            </div>

            <div className="bg-[#0c1018] p-3 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase">Concentration Ratio (B/S)</span>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {(scripConcentration.top5BuyerSharePercent / scripConcentration.top5SellerSharePercent).toFixed(2)}x
              </div>
              <span className="text-[10px] text-slate-400">Net Buyer Dominance</span>
            </div>

            <div className="bg-[#0c1018] p-3 rounded border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 text-[10px] uppercase">Full Stock Profile</span>
              <button
                onClick={() => onSelectStock(activeScrip)}
                className="w-full py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-center transition-colors"
              >
                Inspect {activeScrip}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top Floor Broker Clearing Leaderboard */}
      <div className="bg-[#111722] border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="font-bold text-slate-200 text-sm">
            Top Active Broker Houses (Turnover &amp; Flow Analysis)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase bg-slate-900/50">
                <th className="py-3 px-4">Broker No. &amp; Name</th>
                <th className="py-3 px-3 text-right">Buy Turnover</th>
                <th className="py-3 px-3 text-right">Sell Turnover</th>
                <th className="py-3 px-3 text-right">Net Flow (NPR)</th>
                <th className="py-3 px-3 text-right">Total Volume</th>
                <th className="py-3 px-3 text-right">Transactions</th>
                <th className="py-3 px-3 text-center">Flow Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {brokers.map(b => (
                <tr key={b.brokerNumber} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-100">
                      Broker #{b.brokerNumber} - {b.brokerName}
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-right font-semibold text-cyan-300">
                    {formatNepseDenomination(b.buyValue)}
                  </td>

                  <td className="py-3.5 px-3 text-right font-semibold text-slate-300">
                    {formatNepseDenomination(b.sellValue)}
                  </td>

                  <td
                    className={`py-3.5 px-3 text-right font-bold ${
                      b.netValue >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {b.netValue >= 0 ? '+' : ''}{formatNepseDenomination(b.netValue)}
                  </td>

                  <td className="py-3.5 px-3 text-right text-slate-300">
                    {formatNumber(b.buyQuantity + b.sellQuantity, 0)}
                  </td>

                  <td className="py-3.5 px-3 text-right text-slate-400">
                    {formatNumber(b.transactionsCount, 0)}
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'ACCUMULATION'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
