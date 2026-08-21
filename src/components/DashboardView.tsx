import React, { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  Car,
  Wrench,
  TrendingUp,
  AlertTriangle,
  Plus,
  Clock,
  ArrowRight,
  Printer,
  ChevronRight,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';
import { dbStore } from '../lib/dbStore';
import { ResumoDashboard, OrdemServico, StatusOS } from '../types/database';
import { OSPrintModal } from './OSPrintModal';

interface DashboardViewProps {
  onNavigateToNovaOS: () => void;
  onNavigateToHistorico: (placa?: string) => void;
  onNavigateToOrdens: (statusFilter?: StatusOS) => void;
  onNavigateToEstoque: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToNovaOS,
  onNavigateToHistorico,
  onNavigateToOrdens,
  onNavigateToEstoque,
}) => {
  const [resumo, setResumo] = useState<ResumoDashboard>(dbStore.getResumoDashboard());
  const [produtos, setProdutos] = useState(dbStore.getProdutos());
  const [selectedOSToPrint, setSelectedOSToPrint] = useState<OrdemServico | null>(null);

  useEffect(() => {
    const update = () => {
      setResumo(dbStore.getResumoDashboard());
      setProdutos(dbStore.getProdutos());
    };
    const unsubscribe = dbStore.subscribe(update);
    update();
    return () => unsubscribe();
  }, []);

  const produtosEstoqueBaixo = produtos.filter((p) => p.quantidade_estoque <= p.estoque_minimo);

  const getStatusBadge = (status: StatusOS) => {
    const map: Record<StatusOS, { label: string; bg: string; text: string; dot: string }> = {
      orcamento: { label: 'Orçamento', bg: 'bg-zinc-800', text: 'text-zinc-300', dot: 'bg-zinc-400' },
      aprovado: { label: 'Aprovado', bg: 'bg-blue-950/60', text: 'text-blue-400', dot: 'bg-blue-400' },
      em_execucao: { label: 'Em Execução', bg: 'bg-amber-950/60', text: 'text-amber-400', dot: 'bg-amber-400' },
      concluido: { label: 'Concluído', bg: 'bg-emerald-950/60', text: 'text-emerald-400', dot: 'bg-emerald-400' },
      pago: { label: 'Pago', bg: 'bg-green-950/60', text: 'text-green-400', dot: 'bg-green-400' },
      cancelado: { label: 'Cancelado', bg: 'bg-red-950/60', text: 'text-red-400', dot: 'bg-red-400' },
    };
    const s = map[status] || map.orcamento;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text} border border-zinc-700/50`}>
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 p-6 border border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              <Sparkles className="h-3 w-3" />
              Painel Operacional
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">
            Gestão da Oficina Mecânica
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Acompanhe ordens de serviço, faturamento, veículos em manutenção e estoque em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToNovaOS}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nova Ordem de Serviço (OS)
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* OS em Aberto / Andamento */}
        <div
          onClick={() => onNavigateToOrdens()}
          className="group cursor-pointer rounded-2xl bg-zinc-900 border border-zinc-800/80 p-5 hover:border-zinc-700 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              OS em Aberto
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-100">
              {resumo.osAbertas + resumo.osEmExecucao}
            </div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-amber-400">{resumo.osEmExecucao}</span> em execução agora
            </p>
          </div>
        </div>

        {/* Faturamento do Mês */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Faturamento Concluído
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              R$ {resumo.faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              R$ {resumo.faturamentoPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a receber
            </p>
          </div>
        </div>

        {/* Carros no Pátio / Hoje */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Veículos no Pátio
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Car className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-100">
              {resumo.carrosNoPatio}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Veículos em atendimento hoje
            </p>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800/80 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
              Ticket Médio / OS
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-zinc-100 font-mono">
              R$ {resumo.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Baseado nas ordens finalizadas
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Ordens Recentes + Top Serviços */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Tabela de Ordens Recentes (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-zinc-900 border border-zinc-800/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-zinc-100">Ordens de Serviço Recentes</h3>
              <p className="text-xs text-zinc-400">Últimos veículos recebidos na oficina</p>
            </div>
            <button
              onClick={() => onNavigateToOrdens()}
              className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition"
            >
              Ver todas
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 text-zinc-400 font-medium">
                <tr>
                  <th className="pb-3 font-semibold">OS #</th>
                  <th className="pb-3 font-semibold">Veículo / Placa</th>
                  <th className="pb-3 font-semibold">Cliente</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Valor</th>
                  <th className="pb-3 font-semibold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {resumo.osRecentes.map((os) => (
                  <tr key={os.id} className="hover:bg-zinc-800/30 transition group">
                    <td className="py-3 font-mono font-bold text-zinc-200">
                      #{os.numero_os}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigateToHistorico(os.veiculo?.placa)}
                          className="font-mono font-semibold text-blue-400 hover:underline px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[11px]"
                          title="Ver histórico desta placa"
                        >
                          {os.veiculo?.placa || 'PLACA'}
                        </button>
                        <span className="text-zinc-300 truncate max-w-[120px] sm:max-w-[160px]">
                          {os.veiculo?.modelo || 'Modelo'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-zinc-300 truncate max-w-[130px]">
                      {os.cliente?.nome || 'Cliente'}
                    </td>
                    <td className="py-3">{getStatusBadge(os.status)}</td>
                    <td className="py-3 text-right font-mono font-semibold text-zinc-100">
                      R$ {os.valor_total.toFixed(2)}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedOSToPrint(os)}
                          title="Imprimir Comprovante / OS"
                          className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onNavigateToHistorico(os.veiculo?.placa)}
                          title="Histórico Completo do Carro"
                          className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-blue-400 transition"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coluna Direita: Top Serviços & Alerta de Estoque */}
        <div className="space-y-6">
          {/* Top Serviços Mais Realizados */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-zinc-100">Serviços Mais Realizados</h3>
              </div>
            </div>

            <div className="space-y-3">
              {resumo.servicosMaisRealizados.length > 0 ? (
                resumo.servicosMaisRealizados.map((servico, idx) => {
                  const maxTotal = resumo.servicosMaisRealizados[0]?.total || 1;
                  const pct = Math.round((servico.total / maxTotal) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-200 truncate max-w-[180px]">
                          {servico.nome}
                        </span>
                        <span className="font-mono text-zinc-400 font-medium">
                          {servico.quantidade}x (R$ {servico.total.toFixed(0)})
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-zinc-500 italic">Nenhum serviço registrado ainda.</p>
              )}
            </div>
          </div>

          {/* Alerta de Estoque Baixo */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800/80 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-zinc-100">Alerta de Estoque</h3>
              </div>
              <button
                onClick={onNavigateToEstoque}
                className="text-xs font-medium text-amber-400 hover:underline"
              >
                Gerenciar
              </button>
            </div>

            {produtosEstoqueBaixo.length > 0 ? (
              <div className="space-y-2.5">
                {produtosEstoqueBaixo.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-zinc-200">{p.nome_peca}</p>
                      <p className="text-[11px] text-zinc-500">{p.marca || 'Marca geral'}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-400 font-mono">
                        {p.quantidade_estoque} {p.unidade}
                      </span>
                      <p className="text-[10px] text-zinc-500">Mín: {p.estoque_minimo}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-400">
                Todos os itens de estoque estão em níveis regulares.
              </div>
            )}
          </div>
        </div>
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
