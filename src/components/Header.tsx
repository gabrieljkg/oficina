import React from 'react';
import {
  Wrench,
  Plus,
  Database,
  Menu,
  X,
  Sparkles,
  Car
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { getStoredSupabaseConfig } from '../lib/supabase';

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const supabaseConfig = getStoredSupabaseConfig();

  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Painel Geral';
      case 'nova-os':
        return 'Nova Ordem de Serviço';
      case 'historico':
        return 'Histórico por Placa';
      case 'ordens':
        return 'Ordens de Serviço';
      case 'clientes':
        return 'Clientes & Frotas';
      case 'catalogo':
        return 'Catálogo & Estoque';
      case 'supabase-sql':
        return 'Supabase PostgreSQL DDL';
      default:
        return 'AutoFix Pro';
    }
  };

  return (
    <header className="h-16 shrink-0 bg-zinc-950/90 border-b border-zinc-800/80 px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 backdrop-blur-md">
      {/* Zone 1: Brand & View Indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex items-center gap-2">
          <div className="flex md:hidden h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Wrench className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm sm:text-base text-zinc-100 truncate">
            {getTabTitle()}
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links for Desktop (Contract compliant) */}
      <div className="hidden lg:flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/60 text-xs font-semibold">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`px-3 py-1.5 rounded-lg transition ${
            currentTab === 'dashboard' ? 'bg-zinc-800 text-zinc-100 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onSelectTab('historico')}
          className={`px-3 py-1.5 rounded-lg transition ${
            currentTab === 'historico' ? 'bg-zinc-800 text-zinc-100 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Histórico Placa
        </button>
        <button
          onClick={() => onSelectTab('ordens')}
          className={`px-3 py-1.5 rounded-lg transition ${
            currentTab === 'ordens' ? 'bg-zinc-800 text-zinc-100 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Ordens OS
        </button>
        <button
          onClick={() => onSelectTab('supabase-sql')}
          className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
            currentTab === 'supabase-sql' ? 'bg-emerald-600/20 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Database className="h-3 w-3" />
          Supabase SQL
        </button>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-3">
        {/* Supabase Status Chip */}
        <button
          onClick={() => onSelectTab('supabase-sql')}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
            supabaseConfig.isConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
          title="Status da conexão Supabase"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              supabaseConfig.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
            }`}
          />
          {supabaseConfig.isConnected ? 'Supabase Conectado' : 'Modo Demonstração'}
        </button>

        {currentTab !== 'nova-os' && (
          <button
            onClick={() => onSelectTab('nova-os')}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova OS</span>
          </button>
        )}
      </div>
    </header>
  );
};
