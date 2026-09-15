import { useState, useEffect } from 'react';
import { Company, FundamentalMetrics, FundamentalScoreBreakdown } from '../../types';
import { stockService } from '../../services/stockService';
import { fundamentalService } from '../../services/fundamentalService';
import { BarChart3, ShieldCheck, TrendingUp, Filter } from 'lucide-react';
import { formatPercent, formatNepseDenomination } from '../../utils/formatters';

export function FundamentalAnalysisView({ onSelectStock }: { onSelectStock: (symbol: string) => void }) {
  const [data, setData] = useState<Array<{
    company: Company;
    metrics: FundamentalMetrics;
    score: FundamentalScoreBreakdown;
  }>>([]);

  useEffect(() => {
    stockService.getAllStocks().then(async allStocks => {
      const items = await Promise.all(
        allStocks.map(async c => {
          const [metrics, score] = await Promise.all([
            fundamentalService.getMetrics(c.symbol),
            fundamentalService.getScoreForSymbol(c.symbol),
          ]);
          return { company: c, metrics, score };
        })
      );
      setData(items);
    });
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto font-mono text-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span>DETERMINISTIC FUNDAMENTAL ANALYSIS &amp; FINANCIAL RATIOS</span>
        </h1>
        <p className="text-xs text-slate-400 font-sans mt-0.5">
          Quarterly earnings, return metrics, book valuation, and balance-sheet solvency grades
        </p>
      </div>

      <div className="bg-[#111722] border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase bg-slate-900/50">
                <th className="py-3 px-4">Scrip / Sector</th>
                <th className="py-3 px-3 text-center">Score / Grade</th>
                <th className="py-3 px-3 text-right">EPS (NPR)</th>
                <th className="py-3 px-3 text-right">P/E Ratio</th>
                <th className="py-3 px-3 text-right">Book Value</th>
                <th className="py-3 px-3 text-right">P/B Ratio</th>
                <th className="py-3 px-3 text-right">ROE (%)</th>
                <th className="py-3 px-3 text-right">ROA (%)</th>
                <th className="py-3 px-3 text-right">D/E Ratio</th>
                <th className="py-3 px-3 text-right">Profit Growth</th>
                <th className="py-3 px-3 text-right">Div Yield</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.map(({ company, metrics, score }) => (
                <tr key={company.symbol} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => onSelectStock(company.symbol)}
                      className="font-bold text-cyan-400 hover:underline text-sm block"
                    >
                      {company.symbol}
                    </button>
                    <span className="text-[10px] text-slate-400">{company.sectorName}</span>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-block px-2.5 py-1 rounded font-bold text-xs bg-amber-950 border border-amber-800 text-amber-300">
                      {score.totalScore} (Grade {score.grade})
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-right font-bold text-slate-100">
                    Rs. {metrics.eps.toFixed(1)}
                  </td>

                  <td className="py-3.5 px-3 text-right font-semibold text-slate-200">
                    {metrics.peRatio.toFixed(1)}x
                  </td>

                  <td className="py-3.5 px-3 text-right text-slate-300">
                    Rs. {metrics.bookValuePerShare.toFixed(1)}
                  </td>

                  <td className="py-3.5 px-3 text-right font-semibold text-slate-200">
                    {metrics.pbRatio.toFixed(1)}x
                  </td>

                  <td className="py-3.5 px-3 text-right font-bold text-emerald-400">
                    {metrics.roe.toFixed(1)}%
                  </td>

                  <td className="py-3.5 px-3 text-right text-slate-300">
                    {metrics.roa.toFixed(1)}%
                  </td>

                  <td className="py-3.5 px-3 text-right text-slate-300">
                    {metrics.debtToEquity.toFixed(2)}x
                  </td>

                  <td className={`py-3.5 px-3 text-right font-semibold ${metrics.netProfitGrowthYoY >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {metrics.netProfitGrowthYoY >= 0 ? '+' : ''}{metrics.netProfitGrowthYoY}%
                  </td>

                  <td className="py-3.5 px-3 text-right text-cyan-300 font-semibold">
                    {metrics.dividendYield.toFixed(1)}%
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <button
                      onClick={() => onSelectStock(company.symbol)}
                      className="px-2.5 py-1 rounded bg-cyan-600/20 hover:bg-cyan-600 border border-cyan-500/40 text-cyan-300 hover:text-white text-[11px] transition-colors"
                    >
                      Report
                    </button>
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
