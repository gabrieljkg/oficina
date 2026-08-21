import React, { useState, useEffect } from 'react';
import {
  Users,
  Car,
  Search,
  Plus,
  Phone,
  Mail,
  FileText,
  Gauge,
  UserPlus,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { dbStore } from '../lib/dbStore';
import { Cliente, Veiculo } from '../types/database';
import { QuickClienteModal } from './QuickClienteModal';
import { QuickVeiculoModal } from './QuickVeiculoModal';

interface ClientesVeiculosViewProps {
  onNavigateToHistorico: (placa: string) => void;
  onNavigateToNovaOS: () => void;
}

export const ClientesVeiculosView: React.FC<ClientesVeiculosViewProps> = ({
  onNavigateToHistorico,
  onNavigateToNovaOS,
}) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [search, setSearch] = useState('');
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [isVeiculoModalOpen, setIsVeiculoModalOpen] = useState(false);
  const [selectedClienteIdForVeiculo, setSelectedClienteIdForVeiculo] = useState<string | undefined>();

  const loadData = () => {
    setClientes(dbStore.getClientes());
    setVeiculos(dbStore.getVeiculos());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbStore.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  const filteredClientes = clientes.filter((c) => {
    const q = search.toLowerCase();
    const matchesCliente =
      c.nome.toLowerCase().includes(q) ||
      c.telefone.includes(q) ||
      (c.cpf_cnpj && c.cpf_cnpj.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q));

    // Also check if any vehicle owned by this client matches
    const clientVehicles = veiculos.filter((v) => v.cliente_id === c.id);
    const matchesVehicle = clientVehicles.some(
      (v) => v.placa.toLowerCase().includes(q) || v.modelo.toLowerCase().includes(q)
    );

    return matchesCliente || matchesVehicle;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
            <Users className="h-6 w-6 text-blue-500" />
            Clientes & Frotas Cadastradas
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Base relacional de clientes e seus respectivos veículos na oficina mecânica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsClienteModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            Novo Cliente
          </button>
          <button
            onClick={() => {
              setSelectedClienteIdForVeiculo(undefined);
              setIsVeiculoModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-800 border border-zinc-700/80 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-700 transition"
          >
            <Car className="h-4 w-4 text-emerald-400" />
            Novo Veículo
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por Nome do Cliente, Telefone, CPF ou Placa do Veículo..."
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
          />
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
        </div>
      </div>

      {/* Clientes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredClientes.length > 0 ? (
          filteredClientes.map((cliente) => {
            const clientVehicles = veiculos.filter((v) => v.cliente_id === cliente.id);
            return (
              <div
                key={cliente.id}
                className="rounded-2xl bg-zinc-900 border border-zinc-800/80 p-5 space-y-4 hover:border-zinc-700 transition"
              >
                {/* Cliente Top Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-zinc-100">{cliente.nome}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-zinc-400">
                      <span className="flex items-center gap-1 text-zinc-300">
                        <Phone className="h-3 w-3 text-zinc-500" />
                        {cliente.telefone}
                      </span>
                      {cliente.cpf_cnpj && (
                        <span>• CPF/CNPJ: {cliente.cpf_cnpj}</span>
                      )}
                    </div>
                    {cliente.email && (
                      <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {cliente.email}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedClienteIdForVeiculo(cliente.id);
                      setIsVeiculoModalOpen(true);
                    }}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-lg"
                    title="Adicionar outro carro para este cliente"
                  >
                    <Plus className="h-3 w-3" />
                    Carro
                  </button>
                </div>

                {/* Veículos vinculados */}
                <div className="space-y-2 border-t border-zinc-800/80 pt-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Veículos Cadastrados ({clientVehicles.length})
                  </span>

                  {clientVehicles.length > 0 ? (
                    <div className="space-y-2">
                      {clientVehicles.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-emerald-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                              {v.placa}
                            </span>
                            <div>
                              <p className="font-semibold text-zinc-200">{v.marca} {v.modelo}</p>
                              <p className="text-[11px] text-zinc-500">Ano {v.ano} • {v.km_atual.toLocaleString('pt-BR')} km</p>
                            </div>
                          </div>

                          <button
                            onClick={() => onNavigateToHistorico(v.placa)}
                            className="flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 transition"
                          >
                            Histórico
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">Nenhum veículo vinculado.</p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 rounded-2xl bg-zinc-900 border border-zinc-800 p-12 text-center text-xs text-zinc-500">
            Nenhum cliente encontrado.
          </div>
        )}
      </div>

      {/* Modais */}
      <QuickClienteModal
        isOpen={isClienteModalOpen}
        onClose={() => setIsClienteModalOpen(false)}
      />

      <QuickVeiculoModal
        isOpen={isVeiculoModalOpen}
        clienteIdPreSelected={selectedClienteIdForVeiculo}
        onClose={() => setIsVeiculoModalOpen(false)}
      />
    </div>
  );
};
