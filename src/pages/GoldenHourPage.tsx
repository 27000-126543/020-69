import { useMemo, useState, useCallback } from 'react';
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
  Calendar,
  UserRound,
  ListTodo,
  Users,
  ChevronRight,
  X,
  Save,
} from 'lucide-react';
import type { RumorClue, RiskLevel, TaskAssignment } from '@/types';

type ViewMode = 'priority' | 'schedule';

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

function getHoursUntilDeadline(deadline: string): number {
  const now = new Date('2026-06-20T16:00:00');
  const dl = new Date(deadline.replace(' ', 'T'));
  const diffMs = dl.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
}

function formatTimePassed(hours: number): string {
  if (hours < 1) return '不到1小时';
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  return remainHours > 0 ? `${days}天${remainHours}小时` : `${days}天`;
}

function formatHoursRemaining(hours: number): { text: string; color: string; bgColor: string } {
  if (hours < 0) return { text: `已超时 ${formatTimePassed(-hours)}`, color: 'text-brand-accent', bgColor: 'bg-brand-accent/15' };
  if (hours < 6) return { text: `剩 ${formatTimePassed(hours)}`, color: 'text-brand-accent', bgColor: 'bg-brand-accent/15' };
  if (hours < 24) return { text: `剩 ${formatTimePassed(hours)}`, color: 'text-brand-amber', bgColor: 'bg-brand-amber/15' };
  return { text: `剩 ${formatTimePassed(hours)}`, color: 'text-brand-green', bgColor: 'bg-brand-green/15' };
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

function getDefaultDeadline(clue: RumorClue): string {
  const base = new Date('2026-06-20T16:00:00');
  const addHours = clue.riskLevel === 'high' ? 6 : clue.riskLevel === 'medium' ? 24 : 72;
  base.setHours(base.getHours() + addHours);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())} ${pad(base.getHours())}:${pad(base.getMinutes())}`;
}

const defaultSteps = [
  '信息初核',
  '证据采集',
  '平台投诉',
  '撰写声明',
  '官方发布',
  '舆情监测',
  '结案归档',
];

export default function GoldenHourPage() {
  const navigate = useNavigate();
  const { rumorClues, responseSuggestions, brands, teamMembers, assignRumorTask, updateRumorCurrentStep } = useAppStore();
  const [filterRisk, setFilterRisk] = useState<'all' | RiskLevel>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('schedule');
  const [editingClueId, setEditingClueId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    assigneeId: string;
    deadline: string;
    currentStep: string;
  } | null>(null);

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
    const inGolden = rumorClues.filter((c) => {
      const hours = getHoursSinceFirstSeen(c.firstSeenAt);
      return (c.riskLevel === 'high' && hours < 4) ||
        (c.riskLevel === 'medium' && hours < 12) ||
        (c.riskLevel === 'low' && hours < 24);
    }).length;
    const assigned = rumorClues.filter((c) => !!c.assignment).length;
    return { high, medium, low, inGolden, assigned, total: rumorClues.length };
  }, [rumorClues]);

  const workload = useMemo(() => {
    const map: Record<string, RumorClue[]> = {};
    teamMembers.forEach((m) => (map[m.id] = []));
    rumorClues.forEach((c) => {
      if (c.assignment) {
        if (!map[c.assignment.assignee.id]) map[c.assignment.assignee.id] = [];
        map[c.assignment.assignee.id].push(c);
      }
    });
    return map;
  }, [rumorClues, teamMembers]);

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

  const startEdit = useCallback((clue: RumorClue) => {
    setEditingClueId(clue.id);
    if (clue.assignment) {
      setEditForm({
        assigneeId: clue.assignment.assignee.id,
        deadline: clue.assignment.deadline,
        currentStep: clue.assignment.currentStep,
      });
    } else {
      setEditForm({
        assigneeId: teamMembers[0]?.id || '',
        deadline: getDefaultDeadline(clue),
        currentStep: defaultSteps[0],
      });
    }
  }, [teamMembers]);

  const saveEdit = useCallback(() => {
    if (!editingClueId || !editForm) return;
    const assignee = teamMembers.find((m) => m.id === editForm.assigneeId) || teamMembers[0];
    if (!assignee) return;
    const assignment: TaskAssignment = {
      assignee,
      deadline: editForm.deadline,
      currentStep: editForm.currentStep,
    };
    assignRumorTask(editingClueId, assignment);
    setEditingClueId(null);
    setEditForm(null);
  }, [editingClueId, editForm, teamMembers, assignRumorTask]);

  const renderClueCardActions = (clue: RumorClue) => (
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
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-amber" />
            黄金时间处置
          </h2>
          <p className="text-xs text-gray-500 mt-1">按优先级排序 + 处置排班，快速闭环最紧急的谣言线索</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-brand-surface/40 border border-brand-border/30">
            <button
              onClick={() => setViewMode('schedule')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                viewMode === 'schedule' ? 'bg-brand-accent/20 text-brand-accent' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              处置排班
            </button>
            <button
              onClick={() => setViewMode('priority')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                viewMode === 'priority' ? 'bg-brand-accent/20 text-brand-accent' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              优先级列表
            </button>
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
      </div>

      <div className="grid grid-cols-6 gap-4">
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
        <div className="glass-card p-4 border-l-4 border-l-brand-accent">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">已分配</span>
            <UserRound className="w-4 h-4 text-brand-accent" />
          </div>
          <p className="text-2xl font-bold text-brand-accent font-mono mt-1">
            {stats.assigned}<span className="text-sm text-gray-500 font-normal">/{stats.total}</span>
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-brand-amber">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">执行中同事</span>
            <Users className="w-4 h-4 text-brand-amber" />
          </div>
          <p className="text-2xl font-bold text-brand-amber font-mono mt-1">
            {teamMembers.filter((m) => (workload[m.id] || []).length > 0).length}<span className="text-sm text-gray-500 font-normal">/{teamMembers.length}</span>
          </p>
        </div>
      </div>

      {viewMode === 'priority' && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-brand-accent" />
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
                        {clue.assignment && (
                          <span className="px-1.5 py-0.5 rounded bg-brand-green/15 text-brand-green text-[10px] inline-flex items-center gap-1">
                            <UserRound className="w-2.5 h-2.5" />
                            {clue.assignment.assignee.name} · {clue.assignment.currentStep}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-200 leading-relaxed mb-2">{clue.summary}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
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

                    {renderClueCardActions(clue)}
                  </div>
                </div>
              );
            })}
          </div>

          {sortedClues.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">暂无符合条件的线索</div>
          )}
        </div>
      )}

      {viewMode === 'schedule' && (
        <div className="grid grid-cols-[240px_1fr] gap-5">
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-brand-accent" />
              团队负载
            </h3>
            <div className="space-y-2">
              {teamMembers.map((m) => {
                const tasks = workload[m.id] || [];
                const busy = tasks.length;
                const bgColor = busy === 0 ? 'bg-gray-500/20 text-gray-400' :
                  busy <= 1 ? 'bg-brand-green/20 text-brand-green' :
                  busy === 2 ? 'bg-brand-amber/20 text-brand-amber' :
                  'bg-brand-accent/20 text-brand-accent';
                return (
                  <div key={m.id} className="p-2.5 rounded-lg bg-brand-surface/30 border border-brand-border/30">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${bgColor}`}>
                        {m.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium truncate">{m.name}</p>
                        <p className="text-[10px] text-gray-500">{m.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${bgColor}`}>
                        负责 {busy} 条
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {busy === 0 ? '空闲' : busy <= 1 ? '正常' : busy === 2 ? '饱和' : '过载'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-green" />
                处置排班看板
              </h3>
              <span className="text-xs text-gray-500">共 {sortedClues.length} 条，已分配 {sortedClues.filter(c => c.assignment).length} 条</span>
            </div>

            <div className="space-y-3">
              {sortedClues.map((clue, index) => {
                const hoursPassed = getHoursSinceFirstSeen(clue.firstSeenAt);
                const goldenStatus = getGoldenWindowStatus(hoursPassed, clue.riskLevel);
                const completed = getCompletedCount(clue.id);
                const total = getTotalActions(clue.id);
                const progress = total > 0 ? (completed / total) * 100 : 0;
                const isEditing = editingClueId === clue.id;

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
                            {goldenStatus.label}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-brand-navy/40 text-gray-400 text-[10px]">
                            {getBrandName(clue.brandId)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-200 leading-relaxed mb-3">{clue.summary}</p>

                        {!isEditing && clue.assignment && (
                          <div className="p-3 rounded-lg bg-brand-dark/40 border border-brand-border/30 mb-3">
                            <div className="grid grid-cols-3 gap-4 mb-2">
                              <div>
                                <p className="text-[10px] text-gray-500 mb-1">负责人</p>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center text-[10px] font-bold">
                                    {clue.assignment.assignee.avatar}
                                  </div>
                                  <div>
                                    <p className="text-xs text-white font-medium">{clue.assignment.assignee.name}</p>
                                    <p className="text-[10px] text-gray-500">{clue.assignment.assignee.role}</p>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 mb-1">截止时间</p>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-gray-500" />
                                  <span className="text-xs text-gray-200">{clue.assignment.deadline}</span>
                                </div>
                                <span className={`inline-flex mt-1 text-[10px] px-1.5 py-0.5 rounded ${formatHoursRemaining(getHoursUntilDeadline(clue.assignment.deadline)).bgColor} ${formatHoursRemaining(getHoursUntilDeadline(clue.assignment.deadline)).color}`}>
                                  {formatHoursRemaining(getHoursUntilDeadline(clue.assignment.deadline)).text}
                                </span>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 mb-1">当前步骤</p>
                                <div className="flex items-center gap-1.5">
                                  <ChevronRight className="w-3 h-3 text-brand-amber" />
                                  <span className="text-xs text-brand-amber font-medium">{clue.assignment.currentStep}</span>
                                </div>
                                <div className="mt-1.5 flex gap-0.5">
                                  {defaultSteps.map((s, idx) => {
                                    const currentIdx = defaultSteps.indexOf(clue.assignment!.currentStep);
                                    return (
                                      <div
                                        key={s}
                                        className={`flex-1 h-1 rounded-full ${
                                          idx < currentIdx
                                            ? 'bg-brand-green'
                                            : idx === currentIdx
                                            ? 'bg-brand-amber'
                                            : 'bg-brand-surface/60'
                                        }`}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                <span>首次发现: {clue.firstSeenAt}</span>
                                <span>来源: {clue.sourcePlatform}</span>
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-brand-green" />
                                  {completed}/{total} 项
                                </span>
                              </div>
                              <button
                                onClick={() => startEdit(clue)}
                                className="text-[10px] text-brand-accent hover:underline flex items-center gap-1"
                              >
                                <UserRound className="w-3 h-3" />
                                调整分配
                              </button>
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
                        )}

                        {!isEditing && !clue.assignment && (
                          <div className="p-3 rounded-lg border border-dashed border-brand-border/40 mb-3 flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center gap-1.5">
                              <UserRound className="w-3.5 h-3.5" />
                              暂未分配处置人员
                            </span>
                            <button
                              onClick={() => startEdit(clue)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded bg-brand-accent/20 text-brand-accent text-[10px] font-medium hover:bg-brand-accent/30 transition-colors"
                            >
                              立即分配
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {isEditing && editForm && (
                          <div className="p-3 rounded-lg bg-brand-dark/60 border border-brand-accent/30 mb-3">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs text-white font-semibold flex items-center gap-1.5">
                                <UserRound className="w-3.5 h-3.5 text-brand-accent" />
                                {clue.assignment ? '调整处置分配' : '分配处置任务'}
                              </p>
                              <button
                                onClick={() => { setEditingClueId(null); setEditForm(null); }}
                                className="text-gray-500 hover:text-white"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <p className="text-[10px] text-gray-500 mb-1.5">负责人</p>
                                <select
                                  value={editForm.assigneeId}
                                  onChange={(e) => setEditForm({ ...editForm, assigneeId: e.target.value })}
                                  className="w-full bg-brand-surface/60 border border-brand-border/50 rounded px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-brand-accent/50"
                                >
                                  {teamMembers.map((m) => (
                                    <option key={m.id} value={m.id}>{m.name} · {m.role}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 mb-1.5">截止时间</p>
                                <input
                                  type="datetime-local"
                                  value={editForm.deadline.replace(' ', 'T')}
                                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value.replace('T', ' ') })}
                                  className="w-full bg-brand-surface/60 border border-brand-border/50 rounded px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-brand-accent/50"
                                />
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-500 mb-1.5">当前步骤</p>
                                <select
                                  value={editForm.currentStep}
                                  onChange={(e) => setEditForm({ ...editForm, currentStep: e.target.value })}
                                  className="w-full bg-brand-surface/60 border border-brand-border/50 rounded px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-brand-accent/50"
                                >
                                  {defaultSteps.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex justify-end mt-3">
                              <button
                                onClick={saveEdit}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-green/20 text-brand-green text-xs font-medium hover:bg-brand-green/30 transition-colors"
                              >
                                <Save className="w-3 h-3" />
                                保存分配
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {renderClueCardActions(clue)}
                    </div>
                  </div>
                );
              })}
            </div>

            {sortedClues.length === 0 && (
              <div className="text-center py-12 text-gray-500 text-sm">暂无符合条件的线索</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
