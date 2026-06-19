import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { categoryLabels } from '@/data/mockData';
import { Plus, X, Building2, MapPin, Tag, AlertTriangle, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import type { BrandProfile, ExclusionWord } from '@/types';

export default function MonitorPage() {
  const { brands, exclusionWords, rumorClues, addBrand, removeBrand, addExclusionWord, removeExclusionWord } = useAppStore();
  const navigate = useNavigate();
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [showWordForm, setShowWordForm] = useState(false);
  const [newBrand, setNewBrand] = useState({ brandName: '', productNames: '', storeCities: '', commonMisnomers: '' });
  const [newWord, setNewWord] = useState({ word: '', category: '' });
  const [expandedClue, setExpandedClue] = useState<string | null>(null);

  const handleAddBrand = () => {
    if (!newBrand.brandName.trim()) return;
    const brand: BrandProfile = {
      id: `brand-${Date.now()}`,
      brandName: newBrand.brandName.trim(),
      productNames: newBrand.productNames.split(/[,，、]/).map((s) => s.trim()).filter(Boolean),
      storeCities: newBrand.storeCities.split(/[,，、]/).map((s) => s.trim()).filter(Boolean),
      commonMisnomers: newBrand.commonMisnomers.split(/[,，、]/).map((s) => s.trim()).filter(Boolean),
    };
    addBrand(brand);
    setNewBrand({ brandName: '', productNames: '', storeCities: '', commonMisnomers: '' });
    setShowBrandForm(false);
  };

  const handleAddWord = () => {
    if (!newWord.word.trim()) return;
    const word: ExclusionWord = {
      id: `ew-${Date.now()}`,
      word: newWord.word.trim(),
      category: newWord.category.trim() || '其他',
    };
    addExclusionWord(word);
    setNewWord({ word: '', category: '' });
    setShowWordForm(false);
  };

  const highCount = rumorClues.filter((r) => r.riskLevel === 'high').length;
  const mediumCount = rumorClues.filter((r) => r.riskLevel === 'medium').length;
  const lowCount = rumorClues.filter((r) => r.riskLevel === 'low').length;

  const riskBadge = (level: string) => {
    const map: Record<string, string> = {
      high: 'bg-brand-accent/20 text-brand-accent',
      medium: 'bg-brand-amber/20 text-brand-amber',
      low: 'bg-brand-deep/30 text-blue-300',
    };
    const labelMap: Record<string, string> = { high: '高风险', medium: '中风险', low: '低风险' };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${map[level] || ''}`}>
        <AlertTriangle className="w-3 h-3" />
        {labelMap[level] || level}
      </span>
    );
  };

  const categoryBadge = (category: string) => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-navy/60 text-gray-300 text-xs">
      <TrendingUp className="w-3 h-3" />
      {categoryLabels[category] || category}
    </span>
  );

  const formatNumber = (n: number) => {
    if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">监测清单</h2>
          <p className="text-xs text-gray-500 mt-1">管理品牌信息与谣言线索监控</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>数据截止: 2026-06-20 08:00</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 risk-high">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">高风险线索</span>
            <AlertTriangle className="w-4 h-4 text-brand-accent" />
          </div>
          <p className="text-2xl font-bold text-brand-accent font-mono mt-1">{highCount}</p>
        </div>
        <div className="glass-card p-4 risk-medium">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">中风险线索</span>
            <TrendingUp className="w-4 h-4 text-brand-amber" />
          </div>
          <p className="text-2xl font-bold text-brand-amber font-mono mt-1">{mediumCount}</p>
        </div>
        <div className="glass-card p-4 risk-low">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">低风险线索</span>
            <Clock className="w-4 h-4 text-blue-300" />
          </div>
          <p className="text-2xl font-bold text-blue-300 font-mono mt-1">{lowCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1fr] gap-6">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-accent" />
              品牌信息
            </h3>
            <button
              onClick={() => setShowBrandForm(!showBrandForm)}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-brand-accent hover:bg-brand-accent/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              添加
            </button>
          </div>

          {showBrandForm && (
            <div className="mb-4 p-3 rounded-lg bg-brand-surface/60 border border-brand-border space-y-3">
              <input
                type="text"
                placeholder="品牌名称"
                value={newBrand.brandName}
                onChange={(e) => setNewBrand({ ...newBrand, brandName: e.target.value })}
                className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent/50"
              />
              <input
                type="text"
                placeholder="产品名称（逗号分隔）"
                value={newBrand.productNames}
                onChange={(e) => setNewBrand({ ...newBrand, productNames: e.target.value })}
                className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent/50"
              />
              <input
                type="text"
                placeholder="门店城市（逗号分隔）"
                value={newBrand.storeCities}
                onChange={(e) => setNewBrand({ ...newBrand, storeCities: e.target.value })}
                className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent/50"
              />
              <input
                type="text"
                placeholder="常见误称（逗号分隔）"
                value={newBrand.commonMisnomers}
                onChange={(e) => setNewBrand({ ...newBrand, commonMisnomers: e.target.value })}
                className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent/50"
              />
              <div className="flex gap-2">
                <button onClick={handleAddBrand} className="px-3 py-1.5 rounded bg-brand-accent text-white text-xs font-medium hover:bg-brand-accent/80 transition-colors">确认添加</button>
                <button onClick={() => setShowBrandForm(false)} className="px-3 py-1.5 rounded bg-brand-card text-gray-400 text-xs hover:text-white transition-colors">取消</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {brands.map((brand) => (
              <div key={brand.id} className="p-3 rounded-lg bg-brand-surface/40 border border-brand-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{brand.brandName}</span>
                  <button onClick={() => removeBrand(brand.id)} className="text-gray-500 hover:text-brand-accent transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {brand.productNames.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Tag className="w-3 h-3 text-gray-500 mt-0.5 shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {brand.productNames.map((p, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-brand-accent/10 text-brand-accent text-[10px]">{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {brand.storeCities.length > 0 && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3 h-3 text-gray-500 mt-0.5 shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {brand.storeCities.map((c, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-brand-deep/40 text-blue-300 text-[10px]">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {brand.commonMisnomers.length > 0 && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-gray-500 mt-0.5 shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {brand.commonMisnomers.map((m, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-brand-amber/10 text-brand-amber text-[10px]">{m}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <X className="w-4 h-4 text-brand-amber" />
              排除词管理
            </h3>
            <button
              onClick={() => setShowWordForm(!showWordForm)}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs text-brand-amber hover:bg-brand-amber/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              添加
            </button>
          </div>

          {showWordForm && (
            <div className="mb-4 p-3 rounded-lg bg-brand-surface/60 border border-brand-border space-y-3">
              <input
                type="text"
                placeholder="排除关键词"
                value={newWord.word}
                onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-amber/50"
              />
              <input
                type="text"
                placeholder="分类（如：物流投诉、售后投诉）"
                value={newWord.category}
                onChange={(e) => setNewWord({ ...newWord, category: e.target.value })}
                className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-border text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-amber/50"
              />
              <div className="flex gap-2">
                <button onClick={handleAddWord} className="px-3 py-1.5 rounded bg-brand-amber text-brand-dark text-xs font-medium hover:bg-brand-amber/80 transition-colors">确认添加</button>
                <button onClick={() => setShowWordForm(false)} className="px-3 py-1.5 rounded bg-brand-card text-gray-400 text-xs hover:text-white transition-colors">取消</button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {exclusionWords.map((ew) => (
              <span
                key={ew.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-navy/60 border border-brand-border/50 text-xs text-gray-300 hover:border-brand-amber/40 transition-colors group"
              >
                <span className="text-gray-500 text-[10px]">{ew.category}</span>
                <span>{ew.word}</span>
                <button
                  onClick={() => removeExclusionWord(ew.id)}
                  className="text-gray-500 hover:text-brand-accent transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-brand-accent" />
            疑似谣言线索汇总
          </h3>
          <span className="text-xs text-gray-500">共 {rumorClues.length} 条线索</span>
        </div>

        <div className="space-y-3">
          {rumorClues.map((clue) => {
            const isExpanded = expandedClue === clue.id;
            const brand = brands.find((b) => b.id === clue.brandId);
            return (
              <div
                key={clue.id}
                className={`rounded-lg bg-brand-surface/40 border transition-all duration-200 cursor-pointer ${
                  clue.riskLevel === 'high' ? 'border-brand-accent/30 hover:border-brand-accent/50' :
                  clue.riskLevel === 'medium' ? 'border-brand-amber/30 hover:border-brand-amber/50' :
                  'border-brand-border/50 hover:border-brand-border'
                }`}
                onClick={() => setExpandedClue(isExpanded ? null : clue.id)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {riskBadge(clue.riskLevel)}
                        {categoryBadge(clue.category)}
                        <span className="px-1.5 py-0.5 rounded bg-brand-navy/40 text-gray-400 text-[10px]">
                          {brand?.brandName || '未知品牌'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-200 leading-relaxed">{clue.summary}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-brand-accent font-mono text-lg font-bold">
                        {formatNumber(clue.repostCount)}
                      </div>
                      <p className="text-[10px] text-gray-500">转发量</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>来源: {clue.sourcePlatform}</span>
                    <span>首次发现: {clue.firstSeenAt}</span>
                    <span>关联产品: {clue.relatedProductName}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-brand-border/30 mt-0">
                    <div className="pt-3">
                      <p className="text-xs text-gray-400 leading-relaxed mb-3">{clue.detail}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/review?rumorId=${clue.id}`);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-accent/15 text-brand-accent text-xs font-medium hover:bg-brand-accent/25 transition-colors"
                        >
                          路径复盘 <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/response?rumorId=${clue.id}`);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-green/15 text-brand-green text-xs font-medium hover:bg-brand-green/25 transition-colors"
                        >
                          回应建议 <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
