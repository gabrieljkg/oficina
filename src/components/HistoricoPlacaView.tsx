import React, { useState, useEffect } from 'react';
import {
  Search,
  Car,
  Gauge,
  Calendar,
  Wrench,
  Package,
  Clock,
  Printer,
  History,
  DollarSign,
  ChevronRight,
  TrendingUp,
  User,
  ShieldCheck,
  Fuel,
  Palette
} from 'lucide-react';
import { dbStore } from '../lib/dbStore';
import { Veiculo, OrdemServico } from '../types/database';
import { OSPrintModal } from './OSPrintModal';

interface HistoricoPlacaViewProps {
  initialPlaca?: string;
  onOpenNovaOSComVeiculo?: (veiculo: Veiculo) => void;
}

export const HistoricoPlacaView: React.FC<HistoricoPlacaViewProps> = ({
  initialPlaca = '',
  onOpenNovaOSComVeiculo,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialPlaca);
  const [activePlaca, setActivePlaca] = useState(initialPlaca || 'BRA2E19');
  const [selectedOSToPrint, setSelectedOSToPrint] = useState<OrdemServico | null>(null);

  const veiculos = dbStore.getVeiculos();
  const historicoData = dbStore.getHistoricoPorPlaca(activePlaca);

  useEffect(() => {
    if (initialPlaca) {
      setSearchTerm(initialPlaca);
      setActivePlaca(initialPlaca);
    }
  }, [initialPlaca]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setActivePlaca(searchTerm.trim().toUpperCase());
    }
  };

  const { veiculo, ordens, totalGasto, totalVisitas, kmEvolucao, pecasSubstituidas, servicosRealizados } = historicoData;

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string }> = {
      orcamento: { label: 'Orçamento', bg: 'bg-zinc-800 text-zinc-300' },
      aprovado: { label: 'Aprovado', bg: 'bg-blue-950/60 text-blue-400' },
      em_execucao: { label: 'Em Execução', bg: 'bg-amber-950/60 text-amber-400' },
      concluido: { label: 'Concluído', bg: 'bg-emerald-950/60 text-emerald-400' },
      pago: { label: 'Pago', bg: 'bg-green-950/60 text-green-400' },
      cancelado: { label: 'Cancelado', bg: 'bg-red-950/60 text-red-400' },
    };
    const s = map[status] || { label: status, bg: 'bg-zinc-800 text-zinc-300' };
    return <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${s.bg}`}>{s.label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
              <History className="h-6 w-6 text-blue-500" />
              Histórico do Veículo por Placa
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Consulte a folha corrida automotiva: todas as OSs passadas, peças substituídas e evolução de KM.
            </p>
          </div>

          {/* Quick Placas Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-zinc-500">Exemplos rápidos:</span>
            {veiculos.slice(0, 4).map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setSearchTerm(v.placa);
                  setActivePlaca(v.placa);
                }}
                className={`font-mono px-2 py-1 rounded-lg border text-xs font-semibold transition ${
                  activePlaca === v.placa
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {v.placa}
              </button>
            ))}
          </div>
        </div>

        {/* Big Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              placeholder="Digite a PLACA do veículo (ex: BRA2E19, ABC1234, RTO8F23)..."
              className="w-full rounded-xl bg-zinc-950 border border-zinc-700/80 pl-11 pr-4 py-3 text-base sm:text-lg font-mono font-bold tracking-wider text-emerald-400 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none uppercase"
            />
            <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-500" />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition shadow-sm"
          >
            Buscar
          </button>
        </form>
      </div>

      {veiculo ? (
        <div className="space-y-6">
          {/* Veículo Overview Card */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Car details */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center justify-center h-16 w-24 rounded-xl bg-zinc-950 border-2 border-zinc-700 font-mono text-center p-1 shadow-inner">
                  <span className="text-[9px] font-bold tracking-widest text-blue-400 uppercase">BRASIL</span>
                  <span className="text-base font-black tracking-wider text-emerald-400">{veiculo.placa}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-zinc-100">
                      {veiculo.marca} {veiculo.modelo}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-zinc-400">
                    <span>Ano: <strong className="text-zinc-200">{veiculo.ano}</strong></span>
                    <span>•</span>
                    <span>Cor: <strong className="text-zinc-200">{veiculo.cor || 'Prata'}</strong></span>
                    <span>•</span>
                    <span>Combustível: <strong className="text-zinc-200">{veiculo.combustivel || 'Flex'}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-emerald-400 font-semibold">
                      <Gauge className="h-3.5 w-3.5" />
                      KM Atual: {veiculo.km_atual.toLocaleString('pt-BR')} km
                    </span>
                  </div>

                  {veiculo.cliente && (
                    <div className="mt-2 text-xs text-zinc-400 flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-blue-400" />
                      Proprietário: <strong className="text-zinc-200">{veiculo.cliente.nome}</strong> • {veiculo.cliente.telefone}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats KPIs */}
              <div className="flex items-center gap-4 bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800/80 self-start lg:self-auto">
                <div className="text-center px-3 border-r border-zinc-800">
                  <span className="text-[10px] uppercase text-zinc-500 font-medium">Total de Visitas</span>
                  <p className="text-lg font-bold text-zinc-100">{totalVisitas} OSs</p>
                </div>
                <div className="text-center px-3 border-r border-zinc-800">
                  <span className="text-[10px] uppercase text-zinc-500 font-medium">Investido</span>
                  <p className="text-lg font-bold font-mono text-emerald-400">
                    R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center px-3">
                  <span className="text-[10px] uppercase text-zinc-500 font-medium">Garantia</span>
                  <p className="text-xs font-semibold text-blue-400 flex items-center gap-1 justify-center mt-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Ativa
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Evolução da Quilometragem (KM Timeline) */}
          {kmEvolucao.length > 0 && (
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-zinc-100">Evolução da Quilometragem (KM Registrado nas Visitas)</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {kmEvolucao.map((point, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
                    <div className="flex items-center justify-between text-zinc-500 text-[10px] mb-1">
                      <span>{point.data}</span>
                      <span className="font-mono">OS #{point.osNumero}</span>
                    </div>
                    <p className="text-base font-bold font-mono text-emerald-400">
                      {point.km.toLocaleString('pt-BR')} km
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grid: Timeline de OSs e Peças Trocadas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline das Ordens de Serviço (2 Cols) */}
            <div className="lg:col-span-2 rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-zinc-100">Histórico de Ordens de Serviço ({ordens.length})</h3>
                </div>
              </div>

              {ordens.length > 0 ? (
                <div className="space-y-4">
                  {ordens.map((os) => (
                    <div
                      key={os.id}
                      className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-zinc-100">
                            OS #{os.numero_os}
                          </span>
                          {getStatusBadge(os.status)}
                          <span className="text-xs text-zinc-500 font-mono">
                            {os.km_entrada ? `${os.km_entrada.toLocaleString('pt-BR')} km` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-sm text-emerald-400">
                            R$ {os.valor_total.toFixed(2)}
                          </span>
                          <button
                            onClick={() => setSelectedOSToPrint(os)}
                            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg"
                            title="Imprimir comprovante desta OS"
                          >
                            <Printer className="h-3 w-3" />
                            Imprimir
                          </button>
                        </div>
                      </div>

                      {os.observacoes && (
                        <p className="text-xs text-zinc-300 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/40">
                          {os.observacoes}
                        </p>
                      )}

                      {/* Resumo de Peças & Serviços desta OS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {os.itens_pecas && os.itens_pecas.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                              Peças Utilizadas ({os.itens_pecas.length})
                            </span>
                            <ul className="space-y-0.5 text-zinc-400 text-[11px]">
                              {os.itens_pecas.map((p, i) => (
                                <li key={i} className="truncate">
                                  • {p.quantidade}x {p.produto?.nome_peca || 'Peça'} (R$ {p.subtotal.toFixed(2)})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {os.itens_servicos && os.itens_servicos.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
                              Mão de Obra ({os.itens_servicos.length})
                            </span>
                            <ul className="space-y-0.5 text-zinc-400 text-[11px]">
                              {os.itens_servicos.map((s, i) => (
                                <li key={i} className="truncate">
                                  • {s.quantidade}x {s.servico?.nome_servico || 'Serviço'}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-zinc-500 pt-1 border-t border-zinc-900 flex items-center justify-between">
                        <span>Data: {new Date(os.criado_em).toLocaleDateString('pt-BR')}</span>
                        <span>Mecânico: {os.mecanico_responsavel || 'Oficina'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-zinc-500">
                  Nenhuma ordem de serviço encontrada para este veículo.
                </div>
              )}
            </div>

            {/* Consolidado de Peças e Serviços Passados */}
            <div className="space-y-6">
              {/* Peças Já Trocadas */}
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-zinc-100">Peças Substituídas</h3>
                </div>

                {pecasSubstituidas.length > 0 ? (
                  <div className="space-y-2">
                    {pecasSubstituidas.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-zinc-200">{p.nome}</p>
                          <p className="text-[10px] text-zinc-500">Última em {p.data}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-amber-400 font-mono">{p.quantidade} un</span>
                          <p className="text-[10px] text-zinc-400">R$ {p.total.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">Nenhum registro de troca de peça.</p>
                )}
              </div>

              {/* Serviços Realizados */}
              <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-zinc-100">Serviços Executados</h3>
                </div>

                {servicosRealizados.length > 0 ? (
                  <div className="space-y-2">
                    {servicosRealizados.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-zinc-200">{s.nome}</p>
                          <p className="text-[10px] text-zinc-500">Último em {s.data}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-purple-400 font-mono">{s.quantidade}x</span>
                          <p className="text-[10px] text-zinc-400">R$ {s.total.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 italic">Nenhum registro de serviço.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-12 text-center space-y-3">
          <Car className="h-10 w-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-zinc-200">Veículo não encontrado</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Não encontramos nenhum veículo com a placa "{activePlaca}". Verifique se a placa foi digitada corretamente.
          </p>
        </div>
      )}

      {/* Modal de Impressão */}
      <OSPrintModal
        os={selectedOSToPrint}
        isOpen={Boolean(selectedOSToPrint)}
        onClose={() => setSelectedOSToPrint(null)}
      />
    </div>
  );
};
