import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppStore, collaboratorRoleLabels } from '@/store/useAppStore';
import { priorityLabels, relevanceLabels, statusLabels, nodeTypeLabels } from '@/data/mockData';
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
  Tag,
  Flag,
  SearchX,
  GitBranch,
  Eye,
  UserRound,
  Calendar,
  ArrowRight,
  Camera,
  Link2,
  FileScan,
  FileCheck,
  Video,
  FileArchive,
  HelpCircle,
  Upload,
  Archive,
  History,
  User,
  Bell,
} from 'lucide-react';
import type { ActionStatus, NodeAnnotation, SpreadNode, RiskLevel, EvidenceMaterial, MaterialKind, MaterialAvailability, ActionLog, ActionType } from '@/types';

type ReminderType = 'deadline_urgent' | 'evidence_expired' | 'complaint_pending';

interface Reminder {
  type: ReminderType;
  description: string;
  targetId: string;
}

const annotationOptions: { value: NodeAnnotation; label: string; icon: typeof CheckCircle2; color: string; bgColor: string }[] = [
  { value: 'none', label: '未标注', icon: Tag, color: 'text-gray-500', bgColor: 'bg-gray-500/15' },
  { value: 'collected', label: '已取证', icon: CheckCircle2, color: 'text-brand-green', bgColor: 'bg-brand-green/15' },
  { value: 'reported', label: '已投诉', icon: Flag, color: 'text-brand-accent', bgColor: 'bg-brand-accent/15' },
  { value: 'pending_verify', label: '待核验', icon: SearchX, color: 'text-brand-amber', bgColor: 'bg-brand-amber/15' },
];

const kindMeta: Record<MaterialKind, { label: string; icon: typeof Camera; color: string; bgColor: string }> = {
  screenshot: { label: '截图', icon: Camera, color: 'text-brand-green', bgColor: 'bg-brand-green/15' },
  link: { label: '链接', icon: Link2, color: 'text-blue-300', bgColor: 'bg-blue-500/15' },
  report: { label: '检测报告', icon: FileScan, color: 'text-brand-accent', bgColor: 'bg-brand-accent/15' },
  receipt: { label: '投诉回执', icon: FileCheck, color: 'text-brand-amber', bgColor: 'bg-brand-amber/15' },
  video: { label: '视频', icon: Video, color: 'text-purple-300', bgColor: 'bg-purple-500/15' },
  document: { label: '文档', icon: FileArchive, color: 'text-cyan-300', bgColor: 'bg-cyan-500/15' },
  other: { label: '其他', icon: HelpCircle, color: 'text-gray-400', bgColor: 'bg-gray-500/15' },
};

const availabilityMeta: Record<MaterialAvailability, { label: string; icon: typeof CheckCircle2; color: string; bgColor: string }> = {
  available: { label: '可用', icon: CheckCircle2, color: 'text-brand-green', bgColor: 'bg-brand-green/15' },
  pending_upload: { label: '待上传', icon: Upload, color: 'text-brand-amber', bgColor: 'bg-brand-amber/15' },
  expired: { label: '已过期', icon: AlertTriangle, color: 'text-brand-accent', bgColor: 'bg-brand-accent/15' },
  archived: { label: '已归档', icon: Archive, color: 'text-gray-400', bgColor: 'bg-gray-500/15' },
};

const actionTypeMeta: Record<ActionType, { label: string; color: string; icon: typeof Circle }> = {
  action_status_change: { label: '任务变更', color: 'text-brand-amber', icon: Clock },
  node_annotation_change: { label: '节点标注', color: 'text-brand-green', icon: CheckCircle2 },
  task_assignment: { label: '任务分配', color: 'text-brand-accent', icon: UserRound },
  task_step_change: { label: '步骤推进', color: 'text-brand-green', icon: GitBranch },
  evidence_added: { label: '证据采集', color: 'text-blue-300', icon: FileText },
  evidence_status_change: { label: '证据状态', color: 'text-purple-300', icon: Archive },
  report_exported: { label: '报告导出', color: 'text-brand-green', icon: FileText },
};

const riskLabelMap: Record<RiskLevel, string> = { high: '高风险', medium: '中风险', low: '低风险' };

function NodeAnnotationBadge({ annotation }: { annotation: NodeAnnotation }) {
  const opt = annotationOptions.find((o) => o.value === annotation) || annotationOptions[0];
  const Icon = opt.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${opt.bgColor} ${opt.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {opt.label}
    </span>
  );
}

function KindBadge({ kind }: { kind: MaterialKind }) {
  const meta = kindMeta[kind];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${meta.bgColor} ${meta.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {meta.label}
    </span>
  );
}

function AvailabilityBadge({ availability }: { availability: MaterialAvailability }) {
  const meta = availabilityMeta[availability];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${meta.bgColor} ${meta.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {meta.label}
    </span>
  );
}

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
  const { rumorClues, spreadNodes, responseSuggestions, updateActionItemStatus, selectNode, actionLogs, updateMaterialAvailability } = useAppStore();
  const [expandedScript, setExpandedScript] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const rumorIdFromUrl = searchParams.get('rumorId');
  const nodeIdFromUrl = searchParams.get('nodeId');
  const activeRumorId = rumorIdFromUrl || rumorClues[0]?.id || null;

  const suggestion = useMemo(() => {
    if (!activeRumorId) return null;
    return responseSuggestions[activeRumorId] || null;
  }, [activeRumorId, responseSuggestions]);

  const activeNodes = useMemo(() => {
    if (!activeRumorId) return [] as SpreadNode[];
    return spreadNodes[activeRumorId] || [];
  }, [activeRumorId, spreadNodes]);

  const activeRumor = useMemo(() => {
    return rumorClues.find((r) => r.id === activeRumorId) || null;
  }, [activeRumorId, rumorClues]);

  const activeLogs = useMemo(() => {
    if (!activeRumorId) return [] as ActionLog[];
    return actionLogs
      .filter((l) => l.rumorId === activeRumorId)
      .sort((a, b) => (new Date(a.timestamp.replace(' ', 'T'))) > (new Date(b.timestamp.replace(' ', 'T'))) ? -1 : 1);
  }, [actionLogs, activeRumorId]);

  const nodeAnnotationStats = useMemo(() => {
    const stats = { collected: 0, reported: 0, pending_verify: 0, none: 0, total: activeNodes.length };
    activeNodes.forEach((n) => { stats[n.annotation] = (stats[n.annotation] || 0) + 1; });
    return stats;
  }, [activeNodes]);

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

  const reminders = useMemo((): Reminder[] => {
    const list: Reminder[] = [];
    if (!activeRumor || !suggestion) return list;

    if (activeRumor.assignment) {
      const now = new Date('2026-06-20T16:00:00');
      const deadline = new Date(activeRumor.assignment.deadline.replace(' ', 'T'));
      const diffMs = deadline.getTime() - now.getTime();
      const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
      if (hoursLeft < 6) {
        list.push({
          type: 'deadline_urgent',
          description: hoursLeft < 0 ? `已超时 ${Math.abs(hoursLeft)} 小时` : `截止时间仅剩 ${hoursLeft} 小时`,
          targetId: 'action-progress-section',
        });
      }
    }

    const hasExpiredEvidence = suggestion.evidenceMaterials.some((m) => m.availability === 'expired');
    if (hasExpiredEvidence) {
      list.push({
        type: 'evidence_expired',
        description: '存在已过期的证据材料，请及时更新',
        targetId: 'evidence-materials-section',
      });
    }

    const hasComplaintPending = suggestion.actionItems.some(
      (item) =>
        item.status !== 'completed' &&
        (item.content.includes('投诉') || item.content.includes('举报') || item.content.includes('下架'))
    );
    if (hasComplaintPending) {
      const hasInProgress = suggestion.actionItems.some(
        (item) =>
          item.status === 'in_progress' &&
          (item.content.includes('投诉') || item.content.includes('举报') || item.content.includes('下架'))
      );
      list.push({
        type: 'complaint_pending',
        description: '有待处理的投诉/举报相关任务',
        targetId: hasInProgress ? 'action-in-progress-col' : 'action-pending-col',
      });
    }

    return list;
  }, [activeRumor, suggestion]);

  const scrollToSection = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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

      {reminders.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-xs font-semibold text-white flex items-center gap-2 mb-3">
            <Bell className="w-3.5 h-3.5 text-brand-accent" />
            协同提醒
            <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-brand-accent/20 text-brand-accent text-[10px] font-bold">
              {reminders.length}
            </span>
          </h3>
          <div className="space-y-2">
            {reminders.map((reminder, idx) => {
              const typeConfig = {
                deadline_urgent: { icon: Clock, color: 'text-brand-accent', bgColor: 'bg-brand-accent/10', borderColor: 'border-brand-accent/20', label: '截止临近' },
                evidence_expired: { icon: AlertTriangle, color: 'text-brand-amber', bgColor: 'bg-brand-amber/10', borderColor: 'border-brand-amber/20', label: '证据过期' },
                complaint_pending: { icon: MessageSquareWarning, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20', label: '投诉待办' },
              };
              const config = typeConfig[reminder.type];
              const Icon = config.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2.5 rounded-lg border ${config.bgColor} ${config.borderColor}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full ${config.bgColor} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                    </div>
                    <div>
                      <p className={`text-[11px] font-medium ${config.color}`}>{config.label}</p>
                      <p className="text-[11px] text-gray-400">{reminder.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => scrollToSection(reminder.targetId)}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium ${config.bgColor} ${config.color} hover:opacity-80 transition-opacity`}
                  >
                    去处理
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeRumor && (
        <div className="glass-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 mb-1.5">{activeRumor.summary}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                <span>来源: {activeRumor.sourcePlatform}</span>
                <span>首次发现: {activeRumor.firstSeenAt}</span>
                <span>风险: {riskLabelMap[activeRumor.riskLevel]}</span>
              </div>
              {activeRumor.assignment && (
                <div className="mt-3 p-2.5 rounded-lg bg-brand-dark/40 border border-brand-border/30 space-y-2">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <UserRound className="w-3.5 h-3.5 text-brand-accent" />
                      <span className="text-[10px] text-gray-500">主负责人:</span>
                      <div className="w-5 h-5 rounded-full bg-brand-accent/20 text-brand-accent text-[10px] flex items-center justify-center font-bold">
                        {activeRumor.assignment.assignee.avatar}
                      </div>
                      <span className="text-xs text-white font-medium">{activeRumor.assignment.assignee.name}</span>
                      <span className="text-[10px] text-gray-500">({activeRumor.assignment.assignee.role})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-amber" />
                      <span className="text-[10px] text-gray-500">截止:</span>
                      <span className="text-xs text-gray-200">{activeRumor.assignment.deadline}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-brand-green" />
                      <span className="text-[10px] text-gray-500">步骤:</span>
                      <span className="text-xs text-brand-green font-medium">{activeRumor.assignment.currentStep}</span>
                    </div>
                  </div>
                  {activeRumor.assignment.collaborators && activeRumor.assignment.collaborators.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-brand-border/20">
                      <Users className="w-3.5 h-3.5 text-blue-300" />
                      <span className="text-[10px] text-gray-500">协助人:</span>
                      {activeRumor.assignment.collaborators.map((c, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px]">
                          <div className="w-3.5 h-3.5 rounded-full bg-blue-500/20 text-blue-300 text-[9px] flex items-center justify-center font-bold">
                            {c.avatar}
                          </div>
                          {c.name}
                          <span className="text-[9px] text-blue-400/70">· {collaboratorRoleLabels[c.collaborationRole] || c.collaborationRole}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => navigate(`/review?rumorId=${activeRumorId}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-deep/40 text-blue-300 text-xs font-medium hover:bg-brand-deep/60 transition-colors justify-center"
              >
                <Eye className="w-3.5 h-3.5" />
                路径复盘
                <ArrowRight className="w-3 h-3" />
              </button>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-brand-green" />
                传播节点标注（与证据材料联动）
              </h3>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-brand-green">已取证: {nodeAnnotationStats.collected}</span>
                <span className="text-brand-accent">已投诉: {nodeAnnotationStats.reported}</span>
                <span className="text-brand-amber">待核验: {nodeAnnotationStats.pending_verify}</span>
                <span className="text-gray-500">未标注: {nodeAnnotationStats.none}</span>
                <span className="text-gray-500">/ {nodeAnnotationStats.total}</span>
              </div>
            </div>
            <div className="space-y-2 mb-2">
              {activeNodes.map((node, idx) => (
                <div
                  key={node.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-brand-surface/30 border border-brand-border/30 hover:border-brand-border/60 transition-colors cursor-pointer group"
                  onClick={() => {
                    selectNode(node.id);
                    navigate(`/review?rumorId=${activeRumorId}`);
                  }}
                >
                  <div className="w-6 h-6 rounded-full bg-brand-navy/60 text-gray-300 text-[10px] flex items-center justify-center shrink-0 font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-white font-medium truncate">{node.title}</span>
                      <NodeAnnotationBadge annotation={node.annotation} />
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">
                      {node.timestamp} · 热度 {node.heatValue.toLocaleString()} · {node.description.slice(0, 30)}...
                    </p>
                  </div>
                  <Eye className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-300 transition-colors shrink-0" />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              点击节点可跳转至路径复盘进行标注
            </p>
          </div>

          <div id="evidence-materials-section" className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-brand-green" />
              证据材料（与传播节点双向关联）
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {suggestion.evidenceMaterials.map((material: EvidenceMaterial) => {
                const linkedNode = material.linkedNodeId
                  ? activeNodes.find((n) => n.id === material.linkedNodeId)
                  : null;
                const matAnnotation = linkedNode?.annotation || 'none';
                return (
                  <div
                    key={material.id}
                    className="p-3 rounded-lg border border-brand-border/50 bg-brand-surface/30 hover:border-brand-green/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <KindBadge kind={material.kind} />
                        <span className="text-sm text-white font-medium">{material.type}</span>
                        {matAnnotation !== 'none' && <NodeAnnotationBadge annotation={matAnnotation} />}
                      </div>
                      <AvailabilityBadge availability={material.availability} />
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed mb-2">{material.description}</p>

                    <div className="space-y-1.5 mb-2 text-[10px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-500 inline-flex items-center gap-1">
                          <User className="w-2.5 h-2.5" />
                          采集人: <span className="text-gray-300">{material.collectedByName || '未记录'}</span>
                        </span>
                        <span className="text-gray-500 inline-flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {material.collectedAt || '未记录'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-500">关联度:</span>
                        <div className="flex items-center gap-0.5">
                          {material.relevance === 'high' && (
                            <>
                              <Star className="w-3 h-3 text-brand-green fill-brand-green" />
                              <Star className="w-3 h-3 text-brand-green fill-brand-green" />
                              <Star className="w-3 h-3 text-brand-green fill-brand-green" />
                              <span className={`ml-1 px-1 py-0.5 rounded ${relevanceColors[material.relevance]}`}>
                                {relevanceLabels[material.relevance]}
                              </span>
                            </>
                          )}
                          {material.relevance === 'medium' && (
                            <>
                              <Star className="w-3 h-3 text-brand-amber fill-brand-amber" />
                              <Star className="w-3 h-3 text-brand-amber fill-brand-amber" />
                              <Star className="w-3 h-3 text-gray-600" />
                              <span className={`ml-1 px-1 py-0.5 rounded ${relevanceColors[material.relevance]}`}>
                                {relevanceLabels[material.relevance]}
                              </span>
                            </>
                          )}
                          {material.relevance === 'low' && (
                            <>
                              <Star className="w-3 h-3 text-blue-400 fill-blue-400" />
                              <Star className="w-3 h-3 text-gray-600" />
                              <Star className="w-3 h-3 text-gray-600" />
                              <span className={`ml-1 px-1 py-0.5 rounded ${relevanceColors[material.relevance]}`}>
                                {relevanceLabels[material.relevance]}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {linkedNode && (
                      <div className="mb-2 p-2 rounded bg-brand-dark/40 border border-brand-border/20">
                        <p className="text-[10px] text-gray-500 mb-1 inline-flex items-center gap-1">
                          <GitBranch className="w-2.5 h-2.5" />
                          来源传播节点（{nodeTypeLabels[linkedNode.nodeType]}）
                        </p>
                        <button
                          onClick={() => {
                            selectNode(linkedNode.id);
                            navigate(`/review?rumorId=${activeRumorId}&nodeId=${linkedNode.id}`);
                          }}
                          className="w-full flex items-center gap-2 text-left group"
                        >
                          <Eye className="w-3 h-3 text-gray-600 group-hover:text-blue-300" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-200 group-hover:text-blue-200 truncate font-medium">
                              {linkedNode.title}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">
                              {linkedNode.timestamp} · {linkedNode.heatValue.toLocaleString()}热度
                            </p>
                          </div>
                          <ExternalLink className="w-2.5 h-2.5 text-gray-600 group-hover:text-blue-300" />
                        </button>
                      </div>
                    )}
                    {!linkedNode && (
                      <div className="mb-2 p-2 rounded bg-brand-dark/20 border border-dashed border-brand-border/20">
                        <p className="text-[10px] text-gray-600 inline-flex items-center gap-1">
                          <SearchX className="w-2.5 h-2.5" />
                          暂未匹配到传播节点
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1.5 border-t border-brand-border/20">
                      <select
                        value={material.availability}
                        onChange={(e) =>
                          activeRumorId && updateMaterialAvailability(activeRumorId, material.id, e.target.value as MaterialAvailability)
                        }
                        className="bg-brand-dark/60 border border-brand-border/40 rounded px-1.5 py-0.5 text-[10px] text-gray-200 focus:outline-none focus:border-brand-green/50 cursor-pointer"
                      >
                        {(Object.keys(availabilityMeta) as MaterialAvailability[]).map((a) => (
                          <option key={a} value={a}>{availabilityMeta[a].label}</option>
                        ))}
                      </select>
                      <div className="flex gap-1.5">
                        {linkedNode && (
                          <button
                            onClick={() => {
                              selectNode(linkedNode.id);
                              navigate(`/review?rumorId=${activeRumorId}&nodeId=${linkedNode.id}`);
                            }}
                            className="text-[10px] text-blue-300 hover:text-blue-200 inline-flex items-center gap-1"
                          >
                            <Eye className="w-2.5 h-2.5" />
                            节点
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div id="action-progress-section" className="glass-card p-5">
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
                const colId = status === 'pending' ? 'action-pending-col' : status === 'in_progress' ? 'action-in-progress-col' : '';

                return (
                  <div key={status} id={colId} className="space-y-2">
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

          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-brand-accent" />
                操作流水时间线
              </h3>
              <span className="text-[10px] text-gray-500">共 {activeLogs.length} 条记录</span>
            </div>
            <div className="relative pl-5 max-h-[420px] overflow-y-auto pr-2">
              <div className="absolute left-1.5 top-1 bottom-1 w-px bg-brand-border/60" />
              {activeLogs.length === 0 && (
                <p className="text-xs text-gray-500">暂无操作记录</p>
              )}
              {activeLogs.map((log) => {
                const tMeta = actionTypeMeta[log.actionType] || {
                  label: log.actionType,
                  color: 'text-gray-400',
                  icon: Circle,
                };
                const TIcon = tMeta.icon;
                const mapDisp = (v: string) => ({
                  collected: '已取证', reported: '已投诉', pending_verify: '待核验', none: '未标注',
                  pending: '未开始', in_progress: '进行中', completed: '已完成',
                  available: '可用', pending_upload: '待上传', expired: '已过期', archived: '已归档',
                }[v] || v);
                return (
                  <div key={log.id} className="relative mb-3 last:mb-0">
                    <div
                      className={`absolute -left-4 top-0.5 w-2.5 h-2.5 rounded-full border-2 border-brand-dark ${tMeta.color.replace('text-', 'bg-')}`}
                    />
                    <div className="p-2.5 rounded-lg bg-brand-surface/30 border border-brand-border/20 hover:border-brand-border/40 transition-colors">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-brand-surface/40 ${tMeta.color}`}>
                          <TIcon className="w-2.5 h-2.5" />
                          {tMeta.label}
                        </span>
                        <span className="text-[10px] text-gray-400">{log.timestamp}</span>
                        <span className="text-[10px] text-gray-500 inline-flex items-center gap-0.5 ml-auto">
                          <User className="w-2.5 h-2.5" />
                          {log.operatorName}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 leading-snug">{log.description}</p>
                      {log.previousValue && log.newValue && log.actionType !== 'task_assignment' && log.actionType !== 'evidence_added' && (
                        <p className="text-[10px] text-gray-500 mt-1 inline-flex items-center gap-1">
                          <span className="text-gray-600 bg-brand-dark/50 px-1.5 py-0.5 rounded">{mapDisp(log.previousValue)}</span>
                          <ArrowRight className="w-2.5 h-2.5 text-gray-600" />
                          <span className={`px-1.5 py-0.5 rounded bg-brand-dark/50 ${tMeta.color}`}>
                            {mapDisp(log.newValue)}
                          </span>
                        </p>
                      )}
                    </div>
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
