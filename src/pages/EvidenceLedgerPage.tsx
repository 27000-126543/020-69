import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { categoryLabels, nodeTypeLabels } from '@/data/mockData';
import {
  FileText,
  Camera,
  Link2,
  FileScan,
  FileCheck,
  Video,
  FileArchive,
  HelpCircle,
  UserRound,
  Calendar,
  ExternalLink,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Archive,
  Upload,
} from 'lucide-react';
import type { EvidenceMaterial, MaterialKind, MaterialAvailability, RiskLevel, SpreadNode } from '@/types';

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

export default function EvidenceLedgerPage() {
  const navigate = useNavigate();
  const { rumorClues, responseSuggestions, spreadNodes, brands, updateMaterialAvailability } = useAppStore();
  const [filterKind, setFilterKind] = useState<'all' | MaterialKind>('all');
  const [filterAvailability, setFilterAvailability] = useState<'all' | MaterialAvailability>('all');
  const [filterRisk, setFilterRisk] = useState<'all' | RiskLevel>('all');
  const [search, setSearch] = useState('');
  const [expandedClueId, setExpandedClueId] = useState<string | null>(rumorClues[0]?.id || null);

  const brandName = (brandId: string) => brands.find((b) => b.id === brandId)?.brandName || '未知品牌';

  const getNode = (rumorId: string, nodeId?: string): SpreadNode | undefined =>
    nodeId ? spreadNodes[rumorId]?.find((n) => n.id === nodeId) : undefined;

  const cluesWithMaterials = useMemo(() => {
    const list = rumorClues
      .map((c) => {
        const mats = responseSuggestions[c.id]?.evidenceMaterials || [];
        let filtered = mats;
        if (filterKind !== 'all') filtered = filtered.filter((m) => m.kind === filterKind);
        if (filterAvailability !== 'all') filtered = filtered.filter((m) => m.availability === filterAvailability);
        if (search.trim()) {
          const s = search.trim().toLowerCase();
          filtered = filtered.filter(
            (m) => m.type.toLowerCase().includes(s) || m.description.toLowerCase().includes(s)
          );
        }
        return { clue: c, materials: filtered, totalCount: mats.length };
      });
    if (filterRisk !== 'all') return list.filter((l) => l.clue.riskLevel === filterRisk && l.materials.length > 0);
    return list.filter((l) => l.materials.length > 0);
  }, [rumorClues, responseSuggestions, filterKind, filterAvailability, filterRisk, search]);

  const stats = useMemo(() => {
    const total: Record<MaterialKind, number> = {
      screenshot: 0, link: 0, report: 0, receipt: 0, video: 0, document: 0, other: 0,
    };
    const avail: Record<MaterialAvailability, number> = {
      available: 0, pending_upload: 0, expired: 0, archived: 0,
    };
    Object.values(responseSuggestions).forEach((sug) => {
      sug.evidenceMaterials.forEach((m) => {
        total[m.kind] = (total[m.kind] || 0) + 1;
        avail[m.availability] = (avail[m.availability] || 0) + 1;
      });
    });
    return { total, avail };
  }, [responseSuggestions]);

  const totalMaterials = Object.values(stats.total).reduce((a, b) => a + b, 0);

  const jumpToNode = (rumorId: string, nodeId?: string) => {
    if (!nodeId) return;
    navigate(`/review?rumorId=${rumorId}&nodeId=${nodeId}`);
  };

  const handleAvailabilityChange = (rumorId: string, materialId: string, avail: MaterialAvailability) => {
    updateMaterialAvailability(rumorId, materialId, avail);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-green" />
            证据台账
          </h2>
          <p className="text-xs text-gray-500 mt-1">按线索汇总所有证据材料，追溯采集信息与来源节点</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {(Object.keys(kindMeta) as MaterialKind[]).map((k) => {
          const meta = kindMeta[k];
          const Icon = meta.icon;
          return (
            <div key={k} className="glass-card p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-400 inline-flex items-center gap-1">
                  <Icon className="w-3 h-3" />
                  {meta.label}
                </span>
              </div>
              <p className={`text-xl font-bold font-mono ${meta.color}`}>{stats.total[k]}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {(Object.keys(availabilityMeta) as MaterialAvailability[]).map((a) => {
          const meta = availabilityMeta[a];
          const Icon = meta.icon;
          return (
            <div key={a} className="glass-card p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-400 inline-flex items-center gap-1">
                  <Icon className="w-3 h-3" />
                  {meta.label}
                </span>
              </div>
              <p className={`text-xl font-bold font-mono ${meta.color}`}>{stats.avail[a]}</p>
            </div>
          );
        })}
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索材料类型或描述..."
              className="bg-brand-surface/60 border border-brand-border/50 rounded px-2 py-1.5 text-xs text-gray-200 w-56 focus:outline-none focus:border-brand-accent/50"
            />
          </div>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            材料类型:
          </span>
          <div className="flex gap-1 flex-wrap">
            {(['all', 'screenshot', 'link', 'report', 'receipt', 'video', 'document', 'other'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilterKind(k)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  filterKind === k
                    ? 'bg-brand-accent/20 text-brand-accent font-medium'
                    : 'bg-brand-surface/40 text-gray-400 hover:text-gray-200'
                }`}
              >
                {k === 'all' ? '全部' : kindMeta[k].label}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500">状态:</span>
          <div className="flex gap-1">
            {(['all', 'available', 'pending_upload', 'expired', 'archived'] as const).map((a) => (
              <button
                key={a}
                onClick={() => setFilterAvailability(a)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  filterAvailability === a
                    ? 'bg-brand-green/20 text-brand-green font-medium'
                    : 'bg-brand-surface/40 text-gray-400 hover:text-gray-200'
                }`}
              >
                {a === 'all' ? '全部' : availabilityMeta[a].label}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-500">风险:</span>
          <div className="flex gap-1">
            {(['all', 'high', 'medium', 'low'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilterRisk(r)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  filterRisk === r
                    ? 'bg-brand-amber/20 text-brand-amber font-medium'
                    : 'bg-brand-surface/40 text-gray-400 hover:text-gray-200'
                }`}
              >
                {r === 'all' ? '全部' : r === 'high' ? '高' : r === 'medium' ? '中' : '低'}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-gray-500 mt-3 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          符合条件材料：共 <span className="text-brand-green font-medium">{totalMaterials}</span> 条，覆盖
          <span className="text-brand-accent font-medium"> {cluesWithMaterials.length} </span>
          条线索
        </p>
      </div>

      <div className="space-y-3">
        {cluesWithMaterials.map(({ clue, materials, totalCount }) => {
          const expanded = expandedClueId === clue.id;
          return (
            <div key={clue.id} className="glass-card overflow-hidden">
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-brand-surface/20 transition-colors"
                onClick={() => setExpandedClueId(expanded ? null : clue.id)}
              >
                <span className="text-gray-500">
                  {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {riskBadge(clue.riskLevel)}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-navy/60 text-gray-300 text-xs">
                      {categoryLabels[clue.category] || clue.category}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-brand-navy/40 text-gray-400 text-[10px]">{brandName(clue.brandId)}</span>
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed truncate">{clue.summary}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">材料</p>
                    <p className="text-sm font-bold text-brand-green font-mono">{materials.length}<span className="text-[10px] text-gray-500 font-normal">/{totalCount}</span></p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/response?rumorId=${clue.id}`); }}
                    className="px-2.5 py-1.5 rounded bg-brand-accent/20 text-brand-accent text-[11px] font-medium hover:bg-brand-accent/30 transition-colors"
                  >
                    查看回应建议
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="border-t border-brand-border/30 px-4 py-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[10px] text-gray-500 border-b border-brand-border/30">
                          <th className="py-2 px-2 font-medium">类型</th>
                          <th className="py-2 px-2 font-medium">材料描述</th>
                          <th className="py-2 px-2 font-medium">状态</th>
                          <th className="py-2 px-2 font-medium">采集人</th>
                          <th className="py-2 px-2 font-medium">采集时间</th>
                          <th className="py-2 px-2 font-medium">来源节点</th>
                          <th className="py-2 px-2 font-medium">关联度</th>
                          <th className="py-2 px-2 font-medium text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map((m: EvidenceMaterial) => {
                          const node = getNode(clue.id, m.linkedNodeId);
                          return (
                            <tr key={m.id} className="border-b border-brand-border/15 hover:bg-brand-surface/20 transition-colors">
                              <td className="py-2.5 px-2">
                                <KindBadge kind={m.kind} />
                              </td>
                              <td className="py-2.5 px-2">
                                <p className="text-gray-200 font-medium text-[12px] mb-0.5">{m.type}</p>
                                <p className="text-gray-500 text-[10px] leading-snug line-clamp-2">{m.description}</p>
                              </td>
                              <td className="py-2.5 px-2">
                                <select
                                  value={m.availability}
                                  onChange={(e) => handleAvailabilityChange(clue.id, m.id, e.target.value as MaterialAvailability)}
                                  className="bg-brand-dark/60 border border-brand-border/50 rounded px-1.5 py-0.5 text-[10px] text-gray-200 focus:outline-none focus:border-brand-green/50 cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {(Object.keys(availabilityMeta) as MaterialAvailability[]).map((a) => (
                                    <option key={a} value={a}>{availabilityMeta[a].label}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2.5 px-2">
                                <span className="inline-flex items-center gap-1 text-gray-300 text-[11px]">
                                  <div className="w-4 h-4 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center text-[9px] font-bold">
                                    {(m.collectedByName || '?').charAt(0)}
                                  </div>
                                  {m.collectedByName || '未记录'}
                                </span>
                              </td>
                              <td className="py-2.5 px-2">
                                <span className="text-gray-400 text-[11px] inline-flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {m.collectedAt || '未记录'}
                                </span>
                              </td>
                              <td className="py-2.5 px-2">
                                {node ? (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); jumpToNode(clue.id, m.linkedNodeId); }}
                                    className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 text-[11px] hover:underline"
                                  >
                                    <GitBranch className="w-3 h-3" />
                                    <span className="truncate max-w-[150px]">{node.title}</span>
                                    <span className="text-[9px] text-gray-500">({nodeTypeLabels[node.nodeType]})</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </button>
                                ) : (
                                  <span className="text-gray-600 text-[10px]">未关联节点</span>
                                )}
                              </td>
                              <td className="py-2.5 px-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  m.relevance === 'high' ? 'bg-brand-green/15 text-brand-green' :
                                  m.relevance === 'medium' ? 'bg-brand-amber/15 text-brand-amber' :
                                  'bg-blue-500/15 text-blue-300'
                                }`}>
                                  {m.relevance === 'high' ? '高' : m.relevance === 'medium' ? '中' : '低'}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {node && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); jumpToNode(clue.id, m.linkedNodeId); }}
                                      className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 text-[10px]"
                                    >
                                      <Eye className="w-3 h-3" />
                                      节点
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/review?rumorId=${clue.id}`); }}
                                    className="inline-flex items-center gap-1 text-brand-green hover:text-green-300 text-[10px]"
                                  >
                                    <GitBranch className="w-3 h-3" />
                                    传播链
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {materials.length === 0 && (
                      <div className="text-center py-6 text-gray-500 text-xs">此线索暂无符合筛选条件的材料</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {cluesWithMaterials.length === 0 && (
          <div className="glass-card text-center py-12 text-gray-500 text-sm">暂无符合条件的线索</div>
        )}
      </div>
    </div>
  );
}
