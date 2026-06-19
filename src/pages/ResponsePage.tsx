import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { priorityLabels, relevanceLabels, statusLabels } from '@/data/mockData';
import {
  MessageSquareWarning,
  Phone,
  Copy,
  FileText,
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Star,
  AlertTriangle,
  Users,
} from 'lucide-react';
import type { ActionStatus } from '@/types';

const priorityColors: Record<string, string> = {
  urgent: 'bg-brand-accent/20 text-brand-accent border-brand-accent/30',
  high: 'bg-brand-amber/20 text-brand-amber border-brand-amber/30',
  normal: 'bg-brand-deep/30 text-blue-300 border-brand-deep/40',
};

const relevanceColors: Record<string, string> = {
  high: 'bg-brand-green/20 text-brand-green',
  medium: 'bg-brand-amber/20 text-brand-amber',
  low: 'bg-brand-deep/30 text-blue-300',
};

const statusConfig: Record<string, { color: string; icon: typeof Circle; label: string }> = {
  pending: { color: 'text-gray-400', icon: Circle, label: '未开始' },
  in_progress: { color: 'text-brand-amber', icon: Clock, label: '进行中' },
  completed: { color: 'text-brand-green', icon: CheckCircle2, label: '已完成' },
};

export default function ResponsePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { rumorClues, responseSuggestions, updateActionItemStatus } = useAppStore();
  const [expandedScript, setExpandedScript] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const rumorIdFromUrl = searchParams.get('rumorId');
  const activeRumorId = rumorIdFromUrl || rumorClues[0]?.id || null;

  const suggestion = useMemo(() => {
    if (!activeRumorId) return null;
    return responseSuggestions[activeRumorId] || null;
  }, [activeRumorId, responseSuggestions]);

  const activeRumor = useMemo(() => {
    return rumorClues.find((r) => r.id === activeRumorId) || null;
  }, [activeRumorId, rumorClues]);

  const actionStats = useMemo(() => {
    if (!suggestion) return { pending: 0, in_progress: 0, completed: 0, total: 0 };
    const items = suggestion.actionItems;
    return {
      pending: items.filter((i) => i.status === 'pending').length,
      in_progress: items.filter((i) => i.status === 'in_progress').length,
      completed: items.filter((i) => i.status === 'completed').length,
      total: items.length,
    };
  }, [suggestion]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const cycleStatus = (rumorId: string, actionItemId: string, currentStatus: ActionStatus) => {
    const nextMap: Record<ActionStatus, ActionStatus> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
    };
    updateActionItemStatus(rumorId, actionItemId, nextMap[currentStatus]);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">回应建议</h2>
          <p className="text-xs text-gray-500 mt-1">结构化应对方案，把握黄金处置时间</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">选择谣言线索:</span>
          <div className="flex gap-2 flex-wrap">
            {rumorClues.map((clue) => (
              <button
                key={clue.id}
                onClick={() => navigate(`/response?rumorId=${clue.id}`)}
                className={`px-3 py-1.5 rounded text-xs transition-all duration-200 max-w-[280px] truncate ${
                  activeRumorId === clue.id
                    ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/40 font-medium'
                    : 'bg-brand-surface/40 text-gray-400 border border-brand-border/50 hover:text-gray-200 hover:border-brand-border'
                }`}
              >
                {clue.summary.slice(0, 20)}...
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeRumor && (
        <div className="glass-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-200 mb-1">{activeRumor.summary}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>来源: {activeRumor.sourcePlatform}</span>
                <span>首次发现: {activeRumor.firstSeenAt}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {suggestion ? (
        <>
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Phone className="w-4 h-4 text-brand-accent" />
              应联系平台账号
            </h3>
            <div className="space-y-2">
              {suggestion.platformAccounts.map((account, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${priorityColors[account.priority]} bg-brand-surface/30`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${priorityColors[account.priority]}`}>
                      {priorityLabels[account.priority]}
                    </span>
                    <div>
                      <p className="text-sm text-white font-medium">{account.accountName}</p>
                      <p className="text-xs text-gray-400">平台: {account.platform}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">{account.contactInfo}</span>
                    <button
                      onClick={() => handleCopy(account.contactInfo, `contact-${index}`)}
                      className="p-1.5 rounded hover:bg-brand-card transition-colors"
                    >
                      <Copy className={`w-3.5 h-3.5 ${copiedId === `contact-${index}` ? 'text-brand-green' : 'text-gray-500'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-brand-amber" />
              客服口径同步
            </h3>
            <div className="space-y-2">
              {suggestion.customerServiceScripts.map((script, index) => {
                const isExpanded = expandedScript === index;
                return (
                  <div key={index} className="rounded-lg border border-brand-border/50 bg-brand-surface/30 overflow-hidden">
                    <button
                      onClick={() => setExpandedScript(isExpanded ? null : index)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-brand-card/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-brand-amber/20 text-brand-amber text-[10px] flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm text-white font-medium">{script.keyPoint}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0">
                        <div className="p-3 rounded bg-brand-dark/60 border border-brand-border/30">
                          <p className="text-xs text-gray-300 leading-relaxed">{script.detail}</p>
                          <button
                            onClick={() => handleCopy(script.detail, `script-${index}`)}
                            className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-amber/10 text-brand-amber text-[10px] hover:bg-brand-amber/20 transition-colors"
                          >
                            <Copy className={`w-3 h-3 ${copiedId === `script-${index}` ? 'text-brand-green' : ''}`} />
                            {copiedId === `script-${index}` ? '已复制' : '复制口径'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-brand-green" />
              证据材料匹配
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {suggestion.evidenceMaterials.map((material, index) => (
                <div key={index} className="p-3 rounded-lg border border-brand-border/50 bg-brand-surface/30 hover:border-brand-border transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white font-medium">{material.type}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${relevanceColors[material.relevance]}`}>
                      {relevanceLabels[material.relevance]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">{material.description}</p>
                  <div className="flex items-center gap-0.5">
                    {material.relevance === 'high' && (
                      <>
                        <Star className="w-3 h-3 text-brand-green fill-brand-green" />
                        <Star className="w-3 h-3 text-brand-green fill-brand-green" />
                        <Star className="w-3 h-3 text-brand-green fill-brand-green" />
                      </>
                    )}
                    {material.relevance === 'medium' && (
                      <>
                        <Star className="w-3 h-3 text-brand-amber fill-brand-amber" />
                        <Star className="w-3 h-3 text-brand-amber fill-brand-amber" />
                        <Star className="w-3 h-3 text-gray-600" />
                      </>
                    )}
                    {material.relevance === 'low' && (
                      <>
                        <Star className="w-3 h-3 text-blue-400 fill-blue-400" />
                        <Star className="w-3 h-3 text-gray-600" />
                        <Star className="w-3 h-3 text-gray-600" />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-brand-accent" />
                处置进度追踪
              </h3>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-gray-400">未开始: {actionStats.pending}</span>
                <span className="text-brand-amber">进行中: {actionStats.in_progress}</span>
                <span className="text-brand-green">已完成: {actionStats.completed}</span>
                <span className="text-gray-500">/ {actionStats.total}</span>
              </div>
            </div>

            <div className="mb-4 h-1.5 bg-brand-surface/60 rounded-full overflow-hidden flex">
              {actionStats.total > 0 && (
                <>
                  <div
                    className="h-full bg-brand-green transition-all duration-500"
                    style={{ width: `${(actionStats.completed / actionStats.total) * 100}%` }}
                  />
                  <div
                    className="h-full bg-brand-amber transition-all duration-500"
                    style={{ width: `${(actionStats.in_progress / actionStats.total) * 100}%` }}
                  />
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {(['pending', 'in_progress', 'completed'] as ActionStatus[]).map((status) => {
                const config = statusConfig[status];
                const Icon = config.icon;
                const items = suggestion.actionItems.filter((i) => i.status === status);

                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                      <span className="text-[10px] text-gray-600">({items.length})</span>
                    </div>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => cycleStatus(activeRumorId!, item.id, item.status)}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all duration-200 hover:border-brand-border/80 ${
                          status === 'completed'
                            ? 'bg-brand-green/5 border-brand-green/20'
                            : status === 'in_progress'
                            ? 'bg-brand-amber/5 border-brand-amber/20'
                            : 'bg-brand-surface/30 border-brand-border/40'
                        }`}
                      >
                        <p className={`text-xs leading-relaxed ${status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                          {item.content}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card p-12 text-center">
          <MessageSquareWarning className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">请从上方选择一条谣言线索查看回应建议</p>
        </div>
      )}
    </div>
  );
}
