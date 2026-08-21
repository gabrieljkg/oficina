import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { NovaOSView } from './components/NovaOSView';
import { HistoricoPlacaView } from './components/HistoricoPlacaView';
import { OrdensServicoView } from './components/OrdensServicoView';
import { ClientesVeiculosView } from './components/ClientesVeiculosView';
import { CatalogoView } from './components/CatalogoView';
import { SupabaseSqlView } from './components/SupabaseSqlView';
import { dbStore } from './lib/dbStore';
import { StatusOS, Veiculo } from './types/database';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  FileText,
  Users,
  Package,
  Database,
  X
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [osCount, setOsCount] = useState<number>(0);
  const [selectedPlacaForHistorico, setSelectedPlacaForHistorico] = useState<string>('BRA2E19');
  const [statusFilterForOrdens, setStatusFilterForOrdens] = useState<StatusOS | undefined>(undefined);

  useEffect(() => {
    const update = () => {
      const ordens = dbStore.getOrdens();
      setOsCount(ordens.length);
    };
    update();
    const unsubscribe = dbStore.subscribe(update);
    return () => unsubscribe();
  }, []);

  const handleNavigateToHistorico = (placa?: string) => {
    if (placa) {
      setSelectedPlacaForHistorico(placa);
    }
    setCurrentTab('historico');
    setMobileMenuOpen(false);
  };

  const handleNavigateToOrdens = (statusFilter?: StatusOS) => {
    setStatusFilterForOrdens(statusFilter);
    setCurrentTab('ordens');
    setMobileMenuOpen(false);
  };

  const handleNavigateToNovaOS = () => {
    setCurrentTab('nova-os');
    setMobileMenuOpen(false);
  };

  const handleNavigateToEstoque = () => {
    setCurrentTab('catalogo');
    setMobileMenuOpen(false);
  };

  const mobileNavItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard Oficina', icon: LayoutDashboard },
    { id: 'nova-os' as NavTab, label: 'Nova OS / Orçamento', icon: PlusCircle },
    { id: 'historico' as NavTab, label: 'Histórico por Placa', icon: History },
    { id: 'ordens' as NavTab, label: 'Ordens de Serviço', icon: FileText },
    { id: 'clientes' as NavTab, label: 'Clientes & Veículos', icon: Users },
    { id: 'catalogo' as NavTab, label: 'Peças & Serviços', icon: Package },
    { id: 'supabase-sql' as NavTab, label: 'Supabase SQL (DDL)', icon: Database },
  ];

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 font-sans antialiased overflow-hidden select-none">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setMobileMenuOpen(false);
        }}
        osCount={osCount}
      />

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/70 backdrop-blur-xs">
          <div className="w-72 bg-zinc-950 border-r border-zinc-800 p-4 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <span className="text-base font-black text-zinc-100">AutoFix Pro</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-1 mt-4">
                {mobileNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 p-2 border-t border-zinc-800">
              AutoFix Pro SaaS • Gestão de Oficina Mecânica
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setMobileMenuOpen(false);
          }}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardView
                onNavigateToNovaOS={handleNavigateToNovaOS}
                onNavigateToHistorico={handleNavigateToHistorico}
                onNavigateToOrdens={handleNavigateToOrdens}
                onNavigateToEstoque={handleNavigateToEstoque}
              />
            )}

            {currentTab === 'nova-os' && (
              <NovaOSView
                onOSCreatedSuccess={(os) => {
                  // Pode manter na tela para ver impressão ou navegar
                }}
              />
            )}

            {currentTab === 'historico' && (
              <HistoricoPlacaView
                initialPlaca={selectedPlacaForHistorico}
                onOpenNovaOSComVeiculo={(veiculo: Veiculo) => {
                  handleNavigateToNovaOS();
                }}
              />
            )}

            {currentTab === 'ordens' && (
              <OrdensServicoView
                initialStatusFilter={statusFilterForOrdens}
                onNavigateToNovaOS={handleNavigateToNovaOS}
                onNavigateToHistorico={handleNavigateToHistorico}
              />
            )}

            {currentTab === 'clientes' && (
              <ClientesVeiculosView
                onNavigateToHistorico={handleNavigateToHistorico}
                onNavigateToNovaOS={handleNavigateToNovaOS}
              />
            )}

            {currentTab === 'catalogo' && <CatalogoView />}

            {currentTab === 'supabase-sql' && <SupabaseSqlView />}
          </div>
        </main>
      </div>
    </div>
  );
}
