import { useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { nodeTypeLabels } from '@/data/mockData';
import { GitBranch, Clock, Flame, Users, ExternalLink, ChevronDown, ArrowRight, Eye, CheckCircle2, Flag, SearchX, Tag, FileDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { SpreadNode, NodeAnnotation, ActionStatus } from '@/types';

const annotationOptions: { value: NodeAnnotation; label: string; icon: typeof CheckCircle2; color: string; bgColor: string }[] = [
  { value: 'none', label: '未标注', icon: Tag, color: 'text-gray-500', bgColor: 'bg-gray-500/15' },
  { value: 'collected', label: '已取证', icon: CheckCircle2, color: 'text-brand-green', bgColor: 'bg-brand-green/15' },
  { value: 'reported', label: '已投诉', icon: Flag, color: 'text-brand-accent', bgColor: 'bg-brand-accent/15' },
  { value: 'pending_verify', label: '待核验', icon: SearchX, color: 'text-brand-amber', bgColor: 'bg-brand-amber/15' },
];

function AnnotationBadge({ annotation, onClick }: { annotation: NodeAnnotation; onClick?: () => void }) {
  const opt = annotationOptions.find((o) => o.value === annotation) || annotationOptions[0];
  const Icon = opt.icon;
  const clickableClass = onClick ? 'cursor-pointer hover:opacity-80' : '';
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${opt.bgColor} ${opt.color} ${clickableClass}`} onClick={onClick}>
      <Icon className="w-2.5 h-2.5" />
      {opt.label}
    </span>
  );
}

function AnnotationSelector({
  current,
  onChange,
}: {
  current: NodeAnnotation;
  onChange: (v: NodeAnnotation) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {annotationOptions.map((opt) => {
        const Icon = opt.icon;
        const isActive = current === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded text-xs transition-all duration-200 border ${
              isActive
                ? `${opt.bgColor} ${opt.color} border-current/30 font-medium`
                : 'bg-brand-surface/40 text-gray-400 border-brand-border/30 hover:text-gray-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const nodeTypeColors: Record<string, string> = {
  small_circle: '#6366f1',
  marketing_account: '#e94560',
  local_community: '#f0a500',
  mainstream_media: '#f97316',
  official_response: '#53d8a8',
};

const nodeTypeBgColors: Record<string, string> = {
  small_circle: 'bg-indigo-500/20 border-indigo-500/40',
  marketing_account: 'bg-brand-accent/20 border-brand-accent/40',
  local_community: 'bg-brand-amber/20 border-brand-amber/40',
  mainstream_media: 'bg-orange-500/20 border-orange-500/40',
  official_response: 'bg-brand-green/20 border-brand-green/40',
};

function NodeDetailPanel({
  node,
  rumorId,
  onClose,
  onUpdateAnnotation,
}: {
  node: SpreadNode;
  rumorId: string;
  onClose: () => void;
  onUpdateAnnotation: (nodeId: string, ann: NodeAnnotation) => void;
}) {
  return (
    <div className="fixed right-0 top-0 h-screen w-[420px] bg-brand-dark border-l border-brand-border z-50 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">节点详情</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-lg">×</button>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${nodeTypeBgColors[node.nodeType]}`}>
            <GitBranch className="w-3 h-3" />
            {nodeTypeLabels[node.nodeType]}
          </span>
          <AnnotationBadge annotation={node.annotation} />
        </div>

        <h4 className="text-base font-semibold text-white mb-2">{node.title}</h4>
        <p className="text-xs text-gray-400 leading-relaxed mb-4">{node.description}</p>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{node.timestamp}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Flame className="w-3.5 h-3.5 text-brand-accent" />
            <span>热度: <span className="text-brand-accent font-mono font-bold">{node.heatValue.toLocaleString()}</span></span>
            {node.previousHeatValue > 0 && (
              <span className="text-brand-green text-[10px]">
                ↑ +{((node.heatValue - node.previousHeatValue) / node.previousHeatValue * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">截图证据</p>
          <div className="rounded-lg overflow-hidden border border-brand-border/50 bg-brand-surface/40">
            <img src={node.screenshotUrl} alt="截图" className="w-full h-auto object-cover" loading="lazy" />
          </div>
        </div>

        <div className="mb-4">
          <a
            href={node.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-deep/40 text-blue-300 text-xs hover:bg-brand-deep/60 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            查看原始链接
          </a>
        </div>

        <div className="glass-card p-4 mb-4">
          <h5 className="text-xs font-semibold text-white flex items-center gap-1.5 mb-3">
            <Tag className="w-3.5 h-3.5" />
            处置标注
          </h5>
          <AnnotationSelector
            current={node.annotation}
            onChange={(v) => onUpdateAnnotation(node.id, v)}
          />
        </div>

        <div className="glass-card p-4">
          <h5 className="text-xs font-semibold text-white flex items-center gap-1.5 mb-3">
            <Users className="w-3.5 h-3.5" />
            受众画像
          </h5>

          <div className="mb-3">
            <p className="text-[10px] text-gray-500 mb-1.5">年龄分布</p>
            <div className="space-y-1.5">
              {node.audienceProfile.ageDistribution.map((age) => (
                <div key={age.range} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-10 text-right">{age.range}</span>
                  <div className="flex-1 h-2 bg-brand-surface/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${age.percentage}%`,
                        backgroundColor: nodeTypeColors[node.nodeType] || '#6366f1',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono w-8">{age.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <p className="text-[10px] text-gray-500 mb-1.5">主要地域</p>
            <div className="flex flex-wrap gap-1">
              {node.audienceProfile.topRegions.map((region) => (
                <span key={region} className="px-1.5 py-0.5 rounded bg-brand-navy/60 text-gray-300 text-[10px]">{region}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-gray-500 mb-1.5">兴趣标签</p>
            <div className="flex flex-wrap gap-1">
              {node.audienceProfile.interestTags.map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 rounded bg-brand-deep/30 text-blue-300 text-[10px]">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { rumorClues, spreadNodes, heatData, selectedNodeId, selectNode, updateNodeAnnotation, responseSuggestions, actionLogs, addActionLog } = useAppStore();

  const rumorIdFromUrl = searchParams.get('rumorId');
  const activeRumorId = rumorIdFromUrl || rumorClues[0]?.id || null;

  const activeNodes = useMemo(() => {
    if (!activeRumorId) return [];
    return spreadNodes[activeRumorId] || [];
  }, [activeRumorId, spreadNodes]);

  const activeHeatData = useMemo(() => {
    if (!activeRumorId) return [];
    return heatData[activeRumorId] || [];
  }, [activeRumorId, heatData]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return activeNodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, activeNodes]);

  const activeRumor = useMemo(() => {
    return rumorClues.find((r) => r.id === activeRumorId) || null;
  }, [activeRumorId, rumorClues]);

  const maxHeat = useMemo(() => {
    if (activeNodes.length === 0) return 1;
    return Math.max(...activeNodes.map((n) => n.heatValue));
  }, [activeNodes]);

  const annotationLabelMap: Record<NodeAnnotation, string> = {
    none: '未标注',
    collected: '已取证',
    reported: '已投诉',
    pending_verify: '待核验',
  };

  const riskLabelMap: Record<string, string> = { high: '高风险', medium: '中风险', low: '低风险' };
  const statusLabelMap: Record<ActionStatus, string> = { pending: '未开始', in_progress: '进行中', completed: '已完成' };

  const handleExportReport = useCallback(() => {
    if (!activeRumor || !activeRumorId) return;
    const suggestion = responseSuggestions[activeRumorId];
    const completed = suggestion ? suggestion.actionItems.filter((a) => a.status === 'completed') : [];
    const pending = suggestion ? suggestion.actionItems.filter((a) => a.status !== 'completed') : [];
    const peakHeat = activeHeatData.length > 0 ? Math.max(...activeHeatData.map((d) => d.heat)) : 0;
    const peakTime = activeHeatData.length > 0 ? activeHeatData.reduce((max, d) => (d.heat > max.heat ? d : max), activeHeatData[0]).time : 'N/A';

    const actionTypeLabelMap: Record<string, string> = {
      action_status_change: '任务变更',
      node_annotation_change: '节点标注',
      task_assignment: '任务分配',
      task_step_change: '步骤推进',
      evidence_added: '证据采集',
      evidence_status_change: '证据状态',
      report_exported: '报告导出',
    };

    const kindLabelMap: Record<string, string> = {
      screenshot: '截图',
      link: '链接',
      report: '检测报告',
      receipt: '投诉回执',
      video: '视频',
      document: '文档',
      other: '其他',
    };

    const availabilityLabelMap: Record<string, string> = {
      available: '可用',
      pending_upload: '待上传',
      expired: '已过期',
      archived: '已归档',
    };

    const relevanceLabelMap: Record<string, string> = {
      high: '高',
      medium: '中',
      low: '低',
    };

    const rumorActionLogs = actionLogs
      .filter((l) => l.rumorId === activeRumorId)
      .sort((a, b) => new Date(a.timestamp.replace(' ', 'T')).getTime() - new Date(b.timestamp.replace(' ', 'T')).getTime());

    const evidenceMaterials = suggestion?.evidenceMaterials || [];

    const lines: string[] = [];
    lines.push(`【谣言线索复盘报告】`);
    lines.push(`生成时间：${new Date().toLocaleString('zh-CN')}`);
    lines.push(``);
    lines.push(`=== 基本信息 ===`);
    lines.push(`线索摘要：${activeRumor.summary}`);
    lines.push(`风险等级：${riskLabelMap[activeRumor.riskLevel]}`);
    lines.push(`来源平台：${activeRumor.sourcePlatform}`);
    lines.push(`首次发现：${activeRumor.firstSeenAt}`);
    lines.push(`累计转发：${activeRumor.repostCount.toLocaleString()}`);
    if (activeRumor.assignment) {
      lines.push(`主负责人：${activeRumor.assignment.assignee.name}（${activeRumor.assignment.assignee.role}）`);
      lines.push(`截止时间：${activeRumor.assignment.deadline}`);
      lines.push(`当前步骤：${activeRumor.assignment.currentStep}`);
    }
    lines.push(``);
    lines.push(`=== 传播链 (${activeNodes.length}个节点) ===`);
    activeNodes.forEach((node, idx) => {
      lines.push(
        `${idx + 1}. [${nodeTypeLabels[node.nodeType]}] ${node.title} | ${node.timestamp} | 热度 ${node.heatValue.toLocaleString()} | 标注:${annotationLabelMap[node.annotation]} | 链接: ${node.linkUrl}`
      );
    });
    lines.push(``);
    lines.push(`=== 操作流水时间线 (${rumorActionLogs.length}条) ===`);
    if (rumorActionLogs.length === 0) {
      lines.push(`  （暂无操作记录）`);
    } else {
      rumorActionLogs.forEach((log) => {
        const typeLabel = actionTypeLabelMap[log.actionType] || log.actionType;
        lines.push(
          `${log.timestamp} [${typeLabel}] ${log.operatorName} ${log.description}`
        );
      });
    }
    lines.push(``);
    lines.push(`=== 热度变化 ===`);
    lines.push(`峰值热度：${peakHeat.toLocaleString()}（${peakTime}）`);
    activeHeatData.forEach((d) => {
      lines.push(`  ${d.time}  热度 ${d.heat.toLocaleString()}${d.event ? `  — 事件: ${d.event}` : ''}`);
    });
    lines.push(``);
    lines.push(`=== 已采取动作 (${completed.length}) ===`);
    if (completed.length === 0) {
      lines.push(`  （暂无）`);
    } else {
      completed.forEach((a) => lines.push(`  ✔ ${a.content}`));
    }
    lines.push(``);
    lines.push(`=== 未完成待办 (${pending.length}) ===`);
    if (pending.length === 0) {
      lines.push(`  （全部完成）`);
    } else {
      pending.forEach((a) => lines.push(`  ☐ [${statusLabelMap[a.status]}] ${a.content}`));
    }
    lines.push(``);
    lines.push(`=== 证据材料清单 (${evidenceMaterials.length}份) ===`);
    if (evidenceMaterials.length === 0) {
      lines.push(`  （暂无证据材料）`);
    } else {
      evidenceMaterials.forEach((m) => {
        const kindLabel = kindLabelMap[m.kind] || m.kind;
        const availLabel = availabilityLabelMap[m.availability] || m.availability;
        const relLabel = relevanceLabelMap[m.relevance] || m.relevance;
        lines.push(
          `[${kindLabel}] ${m.type} | 关联度:${relLabel} | 可用状态:${availLabel} | 采集人:${m.collectedByName || '未知'} | 采集时间:${m.collectedAt || '未知'}`
        );
      });
    }
    lines.push(``);
    lines.push(`—— 报告结束 ——`);

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `复盘报告_${activeRumor.relatedProductName}_${activeRumor.firstSeenAt.slice(0, 10).replace(/-/g, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const operator = activeRumor.assignment?.assignee;
    addActionLog({
      rumorId: activeRumorId,
      actionType: 'report_exported',
      operatorId: operator?.id || 'system',
      operatorName: operator?.name || '系统',
      description: `导出复盘报告（${activeRumor.summary.slice(0, 20)}...）`,
      relatedItemId: activeRumorId,
    });
  }, [activeRumor, activeRumorId, responseSuggestions, activeNodes, activeHeatData, actionLogs, addActionLog]);

  const handleAnnotationChange = useCallback(
    (nodeId: string, ann: NodeAnnotation) => {
      if (!activeRumorId) return;
      updateNodeAnnotation(activeRumorId, nodeId, ann);
    },
    [activeRumorId, updateNodeAnnotation]
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">路径复盘</h2>
          <p className="text-xs text-gray-500 mt-1">追溯谣言传播链路与关键节点</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-green/15 text-brand-green text-xs font-medium hover:bg-brand-green/25 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            导出复盘报告
          </button>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">选择谣言线索:</span>
          <div className="flex gap-2 flex-wrap">
            {rumorClues.map((clue) => (
              <button
                key={clue.id}
                onClick={() => navigate(`/review?rumorId=${clue.id}`)}
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
                <span>转发: {activeRumor.repostCount.toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/response?rumorId=${activeRumorId}`)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded bg-brand-green/15 text-brand-green text-xs font-medium hover:bg-brand-green/25 transition-colors"
            >
              查看回应建议 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-5">
          <GitBranch className="w-4 h-4 text-brand-accent" />
          传播路径
        </h3>

        {activeNodes.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">暂无传播路径数据</div>
        ) : (
          <div className="relative">
            <div className="absolute left-[120px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-brand-accent via-brand-amber to-brand-green opacity-40" />

            <div className="space-y-6">
              {activeNodes.map((node, index) => {
                const heatRatio = maxHeat > 0 ? node.heatValue / maxHeat : 0;
                const nodeSize = 36 + heatRatio * 24;
                const isSelected = selectedNodeId === node.id;

                return (
                  <div key={node.id} className="relative flex items-start gap-6">
                    <div className="w-[120px] shrink-0 text-right pt-1">
                      <p className="text-[10px] text-gray-500">{node.timestamp}</p>
                    </div>

                    <div className="relative flex items-center justify-center shrink-0" style={{ width: nodeSize, height: nodeSize }}>
                      <div
                        className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${
                          isSelected ? 'ring-2 ring-white/30' : ''
                        }`}
                        style={{
                          borderColor: nodeTypeColors[node.nodeType],
                          backgroundColor: `${nodeTypeColors[node.nodeType]}20`,
                          boxShadow: isSelected ? `0 0 20px ${nodeTypeColors[node.nodeType]}40` : undefined,
                        }}
                      />
                      <span className="text-xs font-bold text-white z-10">{index + 1}</span>
                      {index < activeNodes.length - 1 && (
                        <ChevronDown className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4 h-4 text-gray-600" />
                      )}
                    </div>

                    <div
                      className={`flex-1 min-w-0 p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-brand-card border-brand-accent/40 glow-accent'
                          : 'bg-brand-surface/30 border-brand-border/30 hover:border-brand-border/60'
                      }`}
                      onClick={() => selectNode(isSelected ? null : node.id)}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            backgroundColor: `${nodeTypeColors[node.nodeType]}20`,
                            color: nodeTypeColors[node.nodeType],
                          }}
                        >
                          {nodeTypeLabels[node.nodeType]}
                        </span>
                        <AnnotationBadge annotation={node.annotation} />
                        <span className="text-xs text-gray-400">{node.title}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{node.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-600">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-brand-accent" />
                          热度 <span className="text-brand-accent font-mono font-bold">{node.heatValue.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          点击查看详情
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {activeHeatData.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-brand-accent" />
            热度趋势
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeHeatData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="heatGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e94560" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#e94560" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3a4e" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={{ stroke: '#2a3a4e' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={{ stroke: '#2a3a4e' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1b2838',
                    border: '1px solid #2a3a4e',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e5e7eb',
                  }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area
                  type="monotone"
                  dataKey="heat"
                  stroke="#e94560"
                  strokeWidth={2}
                  fill="url(#heatGradient)"
                  dot={(props: Record<string, unknown>) => {
                    const { cx, cy, payload } = props as { cx: number; cy: number; payload: { event?: string } };
                    if (payload.event) {
                      return (
                        <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4} fill="#e94560" stroke="#1b2838" strokeWidth={2} />
                      );
                    }
                    return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={2} fill="#e94560" />;
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {activeHeatData.filter((d) => d.event).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {activeHeatData
                .filter((d) => d.event)
                .map((d) => (
                  <span key={d.time} className="px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent text-[10px]">
                    {d.time} · {d.event}
                  </span>
                ))}
            </div>
          )}
        </div>
      )}

      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          rumorId={activeRumorId || ''}
          onClose={() => selectNode(null)}
          onUpdateAnnotation={handleAnnotationChange}
        />
      )}
    </div>
  );
}
