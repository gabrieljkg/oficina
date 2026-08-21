import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  Printer,
  Trash2,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Car,
  User,
  Wrench,
  Package
} from 'lucide-react';
import { dbStore } from '../lib/dbStore';
import { OrdemServico, StatusOS } from '../types/database';
import { OSPrintModal } from './OSPrintModal';

interface OrdensServicoViewProps {
  initialStatusFilter?: StatusOS;
  onNavigateToNovaOS: () => void;
  onNavigateToHistorico: (placa: string) => void;
}

export const OrdensServicoView: React.FC<OrdensServicoViewProps> = ({
  initialStatusFilter,
  onNavigateToNovaOS,
  onNavigateToHistorico,
}) => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'todos');
  const [selectedOSToPrint, setSelectedOSToPrint] = useState<OrdemServico | null>(null);
  const [expandedOSId, setExpandedOSId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOrdens = () => {
    setOrdens(dbStore.getOrdens());
  };

  useEffect(() => {
    loadOrdens();
    const unsubscribe = dbStore.subscribe(loadOrdens);
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (osId: string, newStatus: StatusOS) => {
    try {
      setActionLoading(osId);
      await dbStore.updateStatusOS(osId, newStatus);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOS = async (osId: string) => {
    if (confirm('Tem certeza que deseja excluir esta Ordem de Serviço permanentemente?')) {
      await dbStore.deleteOrdemServico(osId);
    }
  };

  const filteredOrdens = ordens.filter((os) => {
    const matchesStatus = statusFilter === 'todos' || os.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      String(os.numero_os).includes(q) ||
      (os.cliente?.nome && os.cliente.nome.toLowerCase().includes(q)) ||
      (os.veiculo?.placa && os.veiculo.placa.toLowerCase().includes(q)) ||
      (os.veiculo?.modelo && os.veiculo.modelo.toLowerCase().includes(q)) ||
      (os.observacoes && os.observacoes.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: StatusOS) => {
    const map: Record<StatusOS, { label: string; bg: string }> = {
      orcamento: { label: 'Orçamento', bg: 'bg-zinc-800 text-zinc-300' },
      aprovado: { label: 'Aprovado', bg: 'bg-blue-950/60 text-blue-400' },
      em_execucao: { label: 'Em Execução', bg: 'bg-amber-950/60 text-amber-400' },
      concluido: { label: 'Concluído', bg: 'bg-emerald-950/60 text-emerald-400' },
      pago: { label: 'Pago', bg: 'bg-green-950/60 text-green-400' },
      cancelado: { label: 'Cancelado', bg: 'bg-red-950/60 text-red-400' },
    };
    const s = map[status] || map.orcamento;
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} border border-zinc-700/50`}>{s.label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-blue-500" />
            Ordens de Serviço (OS)
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Gestão completa do fluxo de trabalho: orçamentos, aprovações, execuções e emissão de comprovantes.
          </p>
        </div>

        <button
          onClick={onNavigateToNovaOS}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nova OS / Orçamento
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Nº da OS, Cliente, Placa ou Modelo..."
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
          </div>

          {/* Status Pills Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'orcamento', label: 'Orçamento' },
              { id: 'aprovado', label: 'Aprovado' },
              { id: 'em_execucao', label: 'Em Execução' },
              { id: 'concluido', label: 'Concluído' },
              { id: 'pago', label: 'Pago' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  statusFilter === st.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ordens List */}
      <div className="space-y-3">
        {filteredOrdens.length > 0 ? (
          filteredOrdens.map((os) => {
            const isExpanded = expandedOSId === os.id;
            return (
              <div
                key={os.id}
                className="rounded-2xl bg-zinc-900 border border-zinc-800/80 overflow-hidden hover:border-zinc-700 transition"
              >
                {/* Main OS Bar */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Number & Client/Vehicle */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center h-12 w-14 rounded-xl bg-zinc-950 border border-zinc-800 font-mono font-bold text-sm text-zinc-200">
                      #{os.numero_os}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-zinc-100 text-sm sm:text-base">
                          {os.cliente?.nome || 'Cliente'}
                        </span>
                        <button
                          onClick={() => os.veiculo?.placa && onNavigateToHistorico(os.veiculo.placa)}
                          className="font-mono text-xs font-bold text-emerald-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 hover:border-emerald-500 transition"
                        >
                          {os.veiculo?.placa || 'PLACA'}
                        </button>
                        <span className="text-xs text-zinc-400">
                          {os.veiculo?.modelo} ({os.veiculo?.ano})
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400">
                        {os.cliente?.telefone} • Aberta em {new Date(os.criado_em).toLocaleDateString('pt-BR')}
                        {os.km_entrada ? ` • KM: ${os.km_entrada.toLocaleString('pt-BR')}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Status Selector, Total & Actions */}
                  <div className="flex flex-wrap items-center gap-4 justify-between lg:justify-end">
                    {/* Status Dropdown */}
                    <div className="flex items-center gap-2">
                      <select
                        value={os.status}
                        disabled={actionLoading === os.id}
                        onChange={(e) => handleStatusChange(os.id, e.target.value as StatusOS)}
                        className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="orcamento">Orçamento</option>
                        <option value="aprovado">Aprovado</option>
                        <option value="em_execucao">Em Execução</option>
                        <option value="concluido">Concluído</option>
                        <option value="pago">Pago</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>

                    {/* Total */}
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-semibold text-zinc-500">Valor Total</p>
                      <p className="font-mono text-base font-bold text-zinc-100">
                        R$ {os.valor_total.toFixed(2)}
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOSToPrint(os)}
                        className="flex items-center gap-1.5 rounded-xl bg-zinc-800 border border-zinc-700/80 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
                        title="Imprimir OS / Comprovante"
                      >
                        <Printer className="h-3.5 w-3.5 text-blue-400" />
                        <span className="hidden sm:inline">Imprimir</span>
                      </button>

                      <button
                        onClick={() => setExpandedOSId(isExpanded ? null : os.id)}
                        className="rounded-xl bg-zinc-800 border border-zinc-700/80 p-2 text-zinc-300 hover:bg-zinc-700 transition text-xs font-semibold flex items-center gap-1"
                      >
                        {isExpanded ? 'Recolher' : 'Detalhes'}
                      </button>

                      <button
                        onClick={() => handleDeleteOS(os.id)}
                        className="rounded-xl p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition"
                        title="Excluir OS"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="border-t border-zinc-800/80 p-6 bg-zinc-950/40 space-y-4 animate-in fade-in duration-150">
                    {os.observacoes && (
                      <div className="text-xs text-zinc-300 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                        <strong className="text-zinc-400 block mb-1">Diagnóstico / Sintomas informados:</strong>
                        {os.observacoes}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Peças */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5" />
                          Peças & Produtos ({os.itens_pecas?.length || 0})
                        </h4>
                        <div className="space-y-1 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                          {os.itens_pecas && os.itens_pecas.length > 0 ? (
                            os.itens_pecas.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-zinc-300 py-1 border-b border-zinc-800/40 last:border-0">
                                <span>{item.quantidade}x {item.produto?.nome_peca || 'Peça'}</span>
                                <span className="font-mono text-zinc-400">R$ {item.subtotal.toFixed(2)}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-zinc-500 italic">Sem peças nesta OS.</p>
                          )}
                        </div>
                      </div>

                      {/* Serviços */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-purple-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Wrench className="h-3.5 w-3.5" />
                          Serviços & Mão de Obra ({os.itens_servicos?.length || 0})
                        </h4>
                        <div className="space-y-1 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                          {os.itens_servicos && os.itens_servicos.length > 0 ? (
                            os.itens_servicos.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-zinc-300 py-1 border-b border-zinc-800/40 last:border-0">
                                <span>{item.quantidade}x {item.servico?.nome_servico || 'Serviço'}</span>
                                <span className="font-mono text-zinc-400">R$ {item.subtotal.toFixed(2)}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-zinc-500 italic">Sem serviços adicionados.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-12 text-center text-zinc-500 text-xs">
            Nenhuma Ordem de Serviço encontrada com os filtros atuais.
          </div>
        )}
      </div>

      {/* Modal de Impressão */}
      <OSPrintModal
        os={selectedOSToPrint}
        isOpen={Boolean(selectedOSToPrint)}
        onClose={() => setSelectedOSToPrint(null)}
      />
    </div>
  );
};
