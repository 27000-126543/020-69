import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { categoryLabels } from '@/data/mockData';
import {
  Zap,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowRight,
  Filter,
  Flame,
  CheckCircle2,
  Eye,
  MessageSquare,
  Gauge,
} from 'lucide-react';
import type { RumorClue, RiskLevel } from '@/types';

function calculateUrgency(clue: RumorClue): number {
  const riskScore: Record<RiskLevel, number> = {
    high: 100,
    medium: 60,
    low: 30,
  };
  const timeScore = getHoursSinceFirstSeen(clue.firstSeenAt);
  return riskScore[clue.riskLevel] + timeScore * 2;
}

function getHoursSinceFirstSeen(firstSeenAt: string): number {
  const now = new Date('2026-06-20T16:00:00');
  const seen = new Date(firstSeenAt.replace(' ', 'T'));
  const diffMs = now.getTime() - seen.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
}

function formatTimePassed(hours: number): string {
  if (hours < 1) return '不到1小时';
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return remainHours > 0 ? `${days}天${remainHours}小时` : `${days}天`;
}

function getGoldenWindowStatus(hours: number, riskLevel: RiskLevel): { label: string; color: string; bgColor: string } {
  if (riskLevel === 'high') {
    if (hours < 4) return { label: '黄金窗口期', color: 'text-brand-green', bgColor: 'bg-brand-green/15' };
    if (hours < 12) return { label: '处置关键期', color: 'text-brand-amber', bgColor: 'bg-brand-amber/15' };
    return { label: '已超时', color: 'text-brand-accent', bgColor: 'bg-brand-accent/15' };
  }
  if (riskLevel === 'medium') {
    if (hours < 12) return { label: '黄金窗口期', color: 'text-brand-green', bgColor: 'bg-brand-green/15' };
    if (hours < 24) return { label: '处置关键期', color: 'text-brand-amber', bgColor: 'bg-brand-amber/15' };
    return { label: '已超时', color: 'text-brand-accent', bgColor: 'bg-brand-accent/15' };
  }
  if (hours < 24) return { label: '黄金窗口期', color: 'text-brand-green', bgColor: 'bg-brand-green/15' };
  if (hours < 48) return { label: '处置关键期', color: 'text-brand-amber', bgColor: 'bg-brand-amber/15' };
  return { label: '观察期', color: 'text-blue-400', bgColor: 'bg-blue-500/15' };
}

export default function GoldenHourPage() {
  const navigate = useNavigate();
  const { rumorClues, responseSuggestions, brands } = useAppStore();
  const [filterRisk, setFilterRisk] = useState<'all' | RiskLevel>('all');

  const sortedClues = useMemo(() => {
    let filtered = rumorClues;
    if (filterRisk !== 'all') {
      filtered = rumorClues.filter((c) => c.riskLevel === filterRisk);
    }
    return [...filtered].sort((a, b) => {
      const urgencyA = calculateUrgency(a);
      const urgencyB = calculateUrgency(b);
      if (urgencyB !== urgencyA) return urgencyB - urgencyA;
      return new Date(a.firstSeenAt.replace(' ', 'T')).getTime() - new Date(b.firstSeenAt.replace(' ', 'T')).getTime();
    });
  }, [rumorClues, filterRisk]);

  const stats = useMemo(() => {
    const high = rumorClues.filter((c) => c.riskLevel === 'high').length;
    const medium = rumorClues.filter((c) => c.riskLevel === 'medium').length;
    const low = rumorClues.filter((c) => c.riskLevel === 'low').length;
    const total = rumorClues.length;
    const inGolden = rumorClues.filter((c) => {
      const hours = getHoursSinceFirstSeen(c.firstSeenAt);
      return (c.riskLevel === 'high' && hours < 4) ||
        (c.riskLevel === 'medium' && hours < 12) ||
        (c.riskLevel === 'low' && hours < 24);
    }).length;
    return { high, medium, low, total, inGolden };
  }, [rumorClues]);

  const getCompletedCount = (rumorId: string): number => {
    const suggestion = responseSuggestions[rumorId];
    if (!suggestion) return 0;
    return suggestion.actionItems.filter((item) => item.status === 'completed').length;
  };

  const getTotalActions = (rumorId: string): number => {
    const suggestion = responseSuggestions[rumorId];
    if (!suggestion) return 0;
    return suggestion.actionItems.length;
  };

  const getBrandName = (brandId: string): string => {
    const brand = brands.find((b) => b.id === brandId);
    return brand?.brandName || '未知品牌';
  };

  const riskBadge = (level: RiskLevel) => {
    const map: Record<RiskLevel, string> = {
      high: 'bg-brand-accent/20 text-brand-accent',
      medium: 'bg-brand-amber/20 text-brand-amber',
      low: 'bg-brand-deep/30 text-blue-300',
    };
    const labelMap: Record<RiskLevel, string> = { high: '高风险', medium: '中风险', low: '低风险' };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${map[level]}`}>
        <AlertTriangle className="w-3 h-3" />
        {labelMap[level]}
      </span>
    );
  };

  const categoryBadge = (category: string) => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-navy/60 text-gray-300 text-xs">
      <TrendingUp className="w-3 h-3" />
      {categoryLabels[category] || category}
    </span>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-amber" />
            黄金时间处置
          </h2>
          <p className="text-xs text-gray-500 mt-1">按优先级排序，快速处置最紧急的谣言线索</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            筛选:
          </span>
          <div className="flex gap-1">
            {(['all', 'high', 'medium', 'low'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setFilterRisk(level)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  filterRisk === level
                    ? 'bg-brand-accent/20 text-brand-accent font-medium'
                    : 'bg-brand-surface/40 text-gray-400 hover:text-gray-200'
                }`}
              >
                {level === 'all' ? '全部' : level === 'high' ? '高风险' : level === 'medium' ? '中风险' : '低风险'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4 risk-high">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">高风险</span>
            <Flame className="w-4 h-4 text-brand-accent" />
          </div>
          <p className="text-2xl font-bold text-brand-accent font-mono mt-1">{stats.high}</p>
        </div>
        <div className="glass-card p-4 risk-medium">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">中风险</span>
            <AlertTriangle className="w-4 h-4 text-brand-amber" />
          </div>
          <p className="text-2xl font-bold text-brand-amber font-mono mt-1">{stats.medium}</p>
        </div>
        <div className="glass-card p-4 risk-low">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">低风险</span>
            <Gauge className="w-4 h-4 text-blue-300" />
          </div>
          <p className="text-2xl font-bold text-blue-300 font-mono mt-1">{stats.low}</p>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-brand-green">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">黄金窗口内</span>
            <CheckCircle2 className="w-4 h-4 text-brand-green" />
          </div>
          <p className="text-2xl font-bold text-brand-green font-mono mt-1">{stats.inGolden}</p>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-brand-amber" />
            处置优先级列表
          </h3>
          <span className="text-xs text-gray-500">共 {sortedClues.length} 条待处置</span>
        </div>

        <div className="space-y-3">
          {sortedClues.map((clue, index) => {
            const hoursPassed = getHoursSinceFirstSeen(clue.firstSeenAt);
            const goldenStatus = getGoldenWindowStatus(hoursPassed, clue.riskLevel);
            const completed = getCompletedCount(clue.id);
            const total = getTotalActions(clue.id);
            const progress = total > 0 ? (completed / total) * 100 : 0;

            return (
              <div
                key={clue.id}
                className={`p-4 rounded-lg border transition-all duration-200 hover:border-brand-accent/30 ${
                  clue.riskLevel === 'high'
                    ? 'bg-brand-accent/5 border-brand-accent/20'
                    : clue.riskLevel === 'medium'
                    ? 'bg-brand-amber/5 border-brand-amber/20'
                    : 'bg-brand-surface/30 border-brand-border/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    index < 3
                      ? 'bg-brand-accent/20 text-brand-accent'
                      : 'bg-brand-navy/60 text-gray-400'
                  }`}>
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {riskBadge(clue.riskLevel)}
                      {categoryBadge(clue.category)}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${goldenStatus.bgColor} ${goldenStatus.color}`}>
                        <Clock className="w-3 h-3 inline mr-1" />
                        {goldenStatus.label} · {formatTimePassed(hoursPassed)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-brand-navy/40 text-gray-400 text-[10px]">
                        {getBrandName(clue.brandId)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed mb-2">{clue.summary}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>首次发现: {clue.firstSeenAt}</span>
                      <span>来源: {clue.sourcePlatform}</span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-brand-accent" />
                        转发 {clue.repostCount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-brand-green" />
                        已完成 {completed}/{total} 项
                      </span>
                    </div>

                    {total > 0 && (
                      <div className="mt-2 h-1 bg-brand-surface/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-green rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/review?rumorId=${clue.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-deep/40 text-blue-300 text-xs font-medium hover:bg-brand-deep/60 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      路径复盘
                    </button>
                    <button
                      onClick={() => navigate(`/response?rumorId=${clue.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-accent/20 text-brand-accent text-xs font-medium hover:bg-brand-accent/30 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      回应建议
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sortedClues.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            暂无符合条件的线索
          </div>
        )}
      </div>
    </div>
  );
}
