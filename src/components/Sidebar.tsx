import { NavLink } from 'react-router-dom';
import { Eye, GitBranch, MessageSquareWarning, Shield } from 'lucide-react';

const navItems = [
  { to: '/monitor', label: '监测清单', icon: Eye },
  { to: '/review', label: '路径复盘', icon: GitBranch },
  { to: '/response', label: '回应建议', icon: MessageSquareWarning },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-brand-dark border-r border-brand-border flex flex-col z-50">
      <div className="px-5 py-6 flex items-center gap-3 border-b border-brand-border">
        <div className="w-9 h-9 rounded-lg bg-brand-accent/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-brand-accent" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-tight">谣言路径</h1>
          <p className="text-[10px] text-gray-500 leading-tight">品牌声誉分析器</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-brand-accent/15 text-brand-accent font-medium glow-accent'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-brand-card/50'
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px]" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-brand-border">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-brand-green pulse-dot" />
          <span>系统运行中</span>
        </div>
        <p className="text-[10px] text-gray-600 mt-1">数据更新: 今日 08:00</p>
      </div>
    </aside>
  );
}
