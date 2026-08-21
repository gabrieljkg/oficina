import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  FileText,
  Users,
  Package,
  Database,
  Wrench,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { dbStore } from '../lib/dbStore';
import { StatusOS } from '../types/database';

export type NavTab =
  | 'dashboard'
  | 'nova-os'
  | 'historico'
  | 'ordens'
  | 'clientes'
  | 'catalogo'
  | 'supabase-sql';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  osCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, osCount }) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard Oficina',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'nova-os' as NavTab,
      label: 'Nova OS / Orçamento',
      icon: PlusCircle,
      badge: '+ Criar',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    {
      id: 'historico' as NavTab,
      label: 'Histórico por Placa',
      icon: History,
      badge: null,
    },
    {
      id: 'ordens' as NavTab,
      label: 'Ordens de Serviço',
      icon: FileText,
      badge: osCount > 0 ? String(osCount) : null,
      badgeColor: 'bg-zinc-800 text-zinc-300',
    },
    {
      id: 'clientes' as NavTab,
      label: 'Clientes & Veículos',
      icon: Users,
      badge: null,
    },
    {
      id: 'catalogo' as NavTab,
      label: 'Peças & Serviços',
      icon: Package,
      badge: null,
    },
    {
      id: 'supabase-sql' as NavTab,
      label: 'Supabase SQL (DDL)',
      icon: Database,
      badge: 'SQL',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between hidden md:flex">
      {/* Brand Zone */}
      <div>
        <div className="p-6 border-b border-zinc-800/80 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-zinc-100 block">
              AutoFix Pro
            </span>
            <span className="text-[11px] text-zinc-500 block font-medium">
              SaaS Gestão Mecânica & PDV
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? 'text-blue-400' : 'text-zinc-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                      item.badgeColor || 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-950">
        <div className="rounded-xl bg-zinc-900/80 border border-zinc-800/80 p-3 text-xs">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="font-semibold text-zinc-300">Oficina Principal</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-zinc-500">AutoFix Pro v2.4 • Supabase Ready</p>
        </div>
      </div>
    </aside>
  );
};
