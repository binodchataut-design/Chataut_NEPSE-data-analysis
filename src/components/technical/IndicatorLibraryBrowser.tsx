import { useState } from 'react';
import { Search, Filter, HelpCircle, PlusCircle, Check, Info } from 'lucide-react';
import { IndicatorCategory, IndicatorDefinition } from '../../types/technicalIndicators';
import { indicatorRegistry } from '../../engine/technical/indicatorRegistry';

interface Props {
  onSelectIndicatorForDoc: (indicator: IndicatorDefinition) => void;
  activeOverlayIds: string[];
  onToggleOverlay: (id: string) => void;
  activePanelIndicator: string;
  onSelectPanelIndicator: (id: string) => void;
}

export function IndicatorLibraryBrowser({
  onSelectIndicatorForDoc,
  activeOverlayIds,
  onToggleOverlay,
  activePanelIndicator,
  onSelectPanelIndicator
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', ...indicatorRegistry.getCategories()];
  const allIndicators = indicatorRegistry.getAll();

  const filteredIndicators = allIndicators.filter(ind => {
    const matchesCat = selectedCategory === 'ALL' || ind.category === selectedCategory;
    const matchesQuery =
      searchQuery === '' ||
      ind.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ind.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ind.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="bg-[#111722] border border-slate-800 rounded-xl p-4 flex flex-col h-full font-sans text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono">
            <span>INDICATOR RESEARCH DIRECTORY</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 border border-cyan-800 text-cyan-300">
              {allIndicators.length} Implemented
            </span>
          </h2>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Discover mathematical formulas, parameter bounds, and warmup requirements
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search indicator by name or symbol..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 border-b border-slate-800/80 scrollbar-none font-mono text-[11px]">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-cyan-600 text-white font-bold'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto max-h-[480px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredIndicators.map(ind => {
          const isOverlay = ind.overlayOnPrice;
          const isActiveOverlay = activeOverlayIds.includes(ind.id);
          const isActivePanel = activePanelIndicator === ind.id;

          return (
            <div
              key={ind.id}
              className={`p-3 rounded-lg border transition-all flex flex-col justify-between ${
                isActiveOverlay || isActivePanel
                  ? 'bg-cyan-950/20 border-cyan-700/60 shadow-sm'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold">{ind.category}</span>
                    <h3 className="text-xs font-bold text-slate-100 leading-snug">{ind.name}</h3>
                  </div>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {ind.id}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                  {ind.description}
                </p>

                <div className="flex flex-wrap gap-1 mb-3 font-mono text-[10px] text-slate-500">
                  <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    Warmup: {typeof ind.warmupPeriod === 'number' ? `${ind.warmupPeriod} bars` : 'Dynamic'}
                  </span>
                  <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    Type: {ind.overlayOnPrice ? 'Price Overlay' : 'Oscillator Panel'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => onSelectIndicatorForDoc(ind)}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  <Info className="w-3.5 h-3.5" /> Specs & Math
                </button>

                {isOverlay ? (
                  <button
                    onClick={() => onToggleOverlay(ind.id)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-colors ${
                      isActiveOverlay
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {isActiveOverlay ? <Check className="w-3 h-3" /> : <PlusCircle className="w-3 h-3" />}
                    {isActiveOverlay ? 'Overlay Active' : 'Add to Chart'}
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectPanelIndicator(ind.id)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-colors ${
                      isActivePanel
                        ? 'bg-cyan-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {isActivePanel ? <Check className="w-3 h-3" /> : <PlusCircle className="w-3 h-3" />}
                    {isActivePanel ? 'Panel Active' : 'View in Panel'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
