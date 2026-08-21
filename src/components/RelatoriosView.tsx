import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Wrench,
  Percent,
  FileCheck,
  AlertCircle,
  Users,
  PieChart,
  BarChart3,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { dbStore } from '../lib/dbStore';
import { FiltroPeriodoRelatorio, RelatorioFiscalData, RelatorioVendasData, RelatorioEstoqueCurvaABCItem } from '../types/database';

export const RelatoriosView: React.FC = () => {
  const [tab, setTab] = useState<'fiscal' | 'vendas' | 'estoque'>('fiscal');

  // Predefinições de período
  const getInitialDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      dataInicio: firstDay.toISOString().split('T')[0],
      dataFim: now.toISOString().split('T')[0],
    };
  };

  const [periodo, setPeriodo] = useState<FiltroPeriodoRelatorio>(getInitialDates());

  const handleSetPreset = (preset: 'hoje' | '7dias' | 'mes' | 'ano') => {
    const now = new Date();
    const hojeStr = now.toISOString().split('T')[0];

    if (preset === 'hoje') {
      setPeriodo({ dataInicio: hojeStr, dataFim: hojeStr });
    } else if (preset === '7dias') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      setPeriodo({ dataInicio: past.toISOString().split('T')[0], dataFim: hojeStr });
    } else if (preset === 'mes') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setPeriodo({ dataInicio: firstDay.toISOString().split('T')[0], dataFim: hojeStr });
    } else if (preset === 'ano') {
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      setPeriodo({ dataInicio: firstDayOfYear.toISOString().split('T')[0], dataFim: hojeStr });
    }
  };

  // Carregamento dos relatórios
  const relatorioFiscal: RelatorioFiscalData = useMemo(() => {
    return dbStore.getRelatorioFiscal(periodo);
  }, [periodo, tab]);

  const relatorioVendas: RelatorioVendasData = useMemo(() => {
    return dbStore.getRelatorioVendas(periodo);
  }, [periodo, tab]);

  const relatorioEstoque: RelatorioEstoqueCurvaABCItem[] = useMemo(() => {
    return dbStore.getRelatorioEstoqueCurvaABC();
  }, [tab]);

  // Exportar CSV
  const handleExportCSV = () => {
    let csvContent = '';
    let filename = `relatorio_${tab}_${periodo.dataInicio}_${periodo.dataFim}.csv`;

    if (tab === 'fiscal') {
      csvContent = 'Numero;Serie;Tipo;Status SEFAZ;Data Emissao;Cliente;CPF/CNPJ;Valor Pecas;Valor Servicos;Valor Total;Tributos IBPT;Chave Acesso\n';
      relatorioFiscal.notas.forEach((n) => {
        csvContent += `${n.numero};${n.serie};${n.tipo};${n.status_sefaz};${n.data_emissao};"${n.cliente_nome}";${n.cliente_cpf_cnpj};${n.valor_produtos.toFixed(2)};${n.valor_servicos.toFixed(2)};${n.valor_total.toFixed(2)};${(n.valor_impostos_ibpt || 0).toFixed(2)};${n.chave_acesso || ''}\n`;
      });
    } else if (tab === 'vendas') {
      csvContent = 'Mecanico;OS Concluidas;Total Faturado;Comissao Estimada (15% MO)\n';
      relatorioVendas.vendasPorMecanico.forEach((m) => {
        csvContent += `"${m.mecanico}";${m.osConcluidas};${m.totalFaturado.toFixed(2)};${m.comissaoEstimada.toFixed(2)}\n`;
      });
    } else if (tab === 'estoque') {
      csvContent = 'Codigo;Nome;Marca;Classe ABC;Estoque Atual;Estoque Minimo;Preco Custo;Preco Venda;Valor Imobilizado;Total Vendido Qtd;Total Vendido R$\n';
      relatorioEstoque.forEach((e) => {
        csvContent += `${e.codigo};"${e.nome}";"${e.marca}";${e.classe_abc};${e.quantidade_estoque};${e.estoque_minimo};${e.preco_custo.toFixed(2)};${e.preco_venda.toFixed(2)};${e.valor_total_imobilizado.toFixed(2)};${e.total_vendido_quantidade};${e.total_vendido_valor.toFixed(2)}\n`;
      });
    }

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
            <FileSpreadsheet className="h-6 w-6 text-blue-500" />
            Relatórios Fiscais & Gerenciais
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Fechamento contábil para SEFAZ/Contador, análise de lucro bruto e curva ABC de peças.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-500 transition shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Tabs & Period Filter */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setTab('fiscal')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              tab === 'fiscal'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCheck className="h-4 w-4" />
            <span>Fechamento Fiscal & SEFAZ</span>
          </button>

          <button
            onClick={() => setTab('vendas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              tab === 'vendas'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Vendas & Lucro Bruto</span>
          </button>

          <button
            onClick={() => setTab('estoque')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              tab === 'estoque'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Estoque & Curva ABC</span>
          </button>
        </div>

        {/* Date Presets & Custom Picker */}
        {tab !== 'estoque' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-zinc-950 rounded-xl p-1 border border-zinc-800 text-[11px] font-semibold text-zinc-400">
              <button
                onClick={() => handleSetPreset('hoje')}
                className="px-2.5 py-1 rounded-lg hover:text-zinc-100 hover:bg-zinc-800"
              >
                Hoje
              </button>
              <button
                onClick={() => handleSetPreset('7dias')}
                className="px-2.5 py-1 rounded-lg hover:text-zinc-100 hover:bg-zinc-800"
              >
                7 Dias
              </button>
              <button
                onClick={() => handleSetPreset('mes')}
                className="px-2.5 py-1 rounded-lg hover:text-zinc-100 hover:bg-zinc-800"
              >
                Este Mês
              </button>
              <button
                onClick={() => handleSetPreset('ano')}
                className="px-2.5 py-1 rounded-lg hover:text-zinc-100 hover:bg-zinc-800"
              >
                Este Ano
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-zinc-300">
              <input
                type="date"
                value={periodo.dataInicio}
                onChange={(e) => setPeriodo({ ...periodo, dataInicio: e.target.value })}
                className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100"
              />
              <span className="text-zinc-500">até</span>
              <input
                type="date"
                value={periodo.dataFim}
                onChange={(e) => setPeriodo({ ...periodo, dataFim: e.target.value })}
                className="rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* ABA 1: FECHAMENTO FISCAL & SEFAZ */}
      {/* ---------------------------------------------------------------- */}
      {tab === 'fiscal' && (
        <div className="space-y-6">
          {/* Resumo dos Números Fiscais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <p className="text-xs font-semibold text-zinc-400">Total Faturado no Período</p>
              <p className="text-2xl font-black text-zinc-100 mt-2 font-mono">
                R$ {relatorioFiscal.faturamentoTotalAutorizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">{relatorioFiscal.totalNotasAutorizadas} Notas Autorizadas</p>
            </div>

            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <p className="text-xs font-semibold text-zinc-400">NF-e Peças (ICMS/Estadual)</p>
              <p className="text-2xl font-black text-blue-400 mt-2 font-mono">
                R$ {relatorioFiscal.faturamentoNFePecas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">Modelo 55 - Mercadorias</p>
            </div>

            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <p className="text-xs font-semibold text-zinc-400">NFS-e Serviços (ISS/Prefeitura)</p>
              <p className="text-2xl font-black text-purple-400 mt-2 font-mono">
                R$ {relatorioFiscal.faturamentoNFSeServicos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">Mão de Obra Mecânica</p>
            </div>

            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <p className="text-xs font-semibold text-zinc-400">Tributos Totais (IBPT)</p>
              <p className="text-2xl font-black text-amber-400 mt-2 font-mono">
                R$ {relatorioFiscal.totalImpostosEstimadosIBPT.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">Lei Transparência Fiscal</p>
            </div>
          </div>

          {/* Tabela Discriminada para Envio Contábil */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-zinc-100">
                  Espelho das Notas Fiscais Emitidas ({relatorioFiscal.periodoFormatado})
                </h3>
                <p className="text-xs text-zinc-400">
                  Relatório ideal para conferência fiscal mensal e apuração do Simples Nacional / DAS.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-400 font-semibold font-mono">
                  {relatorioFiscal.totalNotasAutorizadas} Autorizadas
                </span>
                {relatorioFiscal.totalNotasCanceladas > 0 && (
                  <span className="text-red-400 font-semibold font-mono">
                    {relatorioFiscal.totalNotasCanceladas} Canceladas
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 uppercase text-[10px] font-semibold">
                    <th className="p-4">Número / Modelo</th>
                    <th className="p-4">Data Emissão</th>
                    <th className="p-4">Tomador / Cliente</th>
                    <th className="p-4">Status SEFAZ</th>
                    <th className="p-4 text-right">Peças (R$)</th>
                    <th className="p-4 text-right">Serviços (R$)</th>
                    <th className="p-4 text-right">Total Nota (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                  {relatorioFiscal.notas.map((n) => (
                    <tr key={n.id} className="hover:bg-zinc-800/30">
                      <td className="p-4 font-mono font-bold">
                        #{n.numero}{' '}
                        <span className="text-[10px] text-zinc-500 font-normal">
                          ({n.tipo.toUpperCase()})
                        </span>
                      </td>
                      <td className="p-4 text-zinc-400">
                        {new Date(n.data_emissao).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-zinc-200">{n.cliente_nome}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{n.cliente_cpf_cnpj}</p>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          n.status_sefaz === 'autorizado'
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-red-950 text-red-400'
                        }`}>
                          {n.status_sefaz}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-zinc-300">
                        R$ {n.valor_produtos.toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-mono text-zinc-300">
                        R$ {n.valor_servicos.toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-zinc-100">
                        R$ {n.valor_total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* ABA 2: VENDAS & LUCRO BRUTO */}
      {/* ---------------------------------------------------------------- */}
      {tab === 'vendas' && (
        <div className="space-y-6">
          {/* DRE Simplificado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <p className="text-xs font-semibold text-zinc-400">Faturamento Bruto (OS Pagas)</p>
              <p className="text-2xl font-black text-zinc-100 mt-2 font-mono">
                R$ {relatorioVendas.faturamentoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">{relatorioVendas.totalOrdensConcluidas} Ordens de Serviço</p>
            </div>

            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <p className="text-xs font-semibold text-zinc-400">Custo Total de Peças (CPV)</p>
              <p className="text-2xl font-black text-red-400 mt-2 font-mono">
                R$ {relatorioVendas.custoTotalPecas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">Custo de aquisição no estoque</p>
            </div>

            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <p className="text-xs font-semibold text-zinc-400">Lucro Bruto Operacional</p>
              <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">
                R$ {relatorioVendas.lucroBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-emerald-500 mt-1">
                Margem de {relatorioVendas.margemLucroPercentual.toFixed(1)}%
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
              <p className="text-xs font-semibold text-zinc-400">Ticket Médio por Veículo</p>
              <p className="text-2xl font-black text-blue-400 mt-2 font-mono">
                R$ {relatorioVendas.ticketMedioOS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">Gasto médio por cliente</p>
            </div>
          </div>

          {/* Desempenho Mecânicos & Categorias */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Produtividade da Equipe */}
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
                <Users className="h-5 w-5 text-blue-500" />
                <h3 className="font-bold text-sm text-zinc-100">
                  Desempenho por Mecânico & Comissões (15% MO)
                </h3>
              </div>

              <div className="space-y-3">
                {relatorioVendas.vendasPorMecanico.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-xs text-zinc-200">{m.mecanico}</p>
                      <p className="text-[11px] text-zinc-400">
                        {m.osConcluidas} OS Concluídas • Faturado: <strong className="text-zinc-200 font-mono">R$ {m.totalFaturado.toFixed(2)}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block uppercase">Comissão Estimada</span>
                      <span className="font-mono font-bold text-xs text-emerald-400">
                        R$ {m.comissaoEstimada.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categorias Mais Vendidas */}
            <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
                <PieChart className="h-5 w-5 text-blue-500" />
                <h3 className="font-bold text-sm text-zinc-100">
                  Categorias de Peças Mais Vendidas
                </h3>
              </div>

              <div className="space-y-3">
                {relatorioVendas.categoriasMaisVendidas.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-300">{cat.categoria}</span>
                      <span className="font-mono font-bold text-zinc-200">
                        R$ {cat.totalFaturado.toFixed(2)} ({cat.percentual.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, cat.percentual)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* ABA 3: ESTOQUE & CURVA ABC */}
      {/* ---------------------------------------------------------------- */}
      {tab === 'estoque' && (
        <div className="space-y-6">
          {/* Card explicativo Curva ABC */}
          <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/50 flex items-start gap-3 text-xs text-blue-300">
            <Layers className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-zinc-100">O que é a Curva ABC de Estoque?</strong>
              <p className="mt-1 leading-relaxed text-zinc-400">
                • <strong className="text-emerald-400">Classe A (80% do Faturamento):</strong> Itens de maior giro e valor que nunca podem faltar.<br />
                • <strong className="text-amber-400">Classe B (15% do Faturamento):</strong> Itens de demanda intermediária.<br />
                • <strong className="text-zinc-400">Classe C (5% do Faturamento):</strong> Itens de baixo giro, exigem cautela para evitar capital parado.
              </p>
            </div>
          </div>

          {/* Tabela Curva ABC */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800">
              <h3 className="font-bold text-sm text-zinc-100">
                Classificação ABC de Peças & Capital Imobilizado
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 uppercase text-[10px] font-semibold">
                    <th className="p-4 text-center">Classe</th>
                    <th className="p-4">Código & Peça</th>
                    <th className="p-4">Marca</th>
                    <th className="p-4 text-center">Estoque / Mín</th>
                    <th className="p-4 text-right">Pço Custo</th>
                    <th className="p-4 text-right">Pço Venda</th>
                    <th className="p-4 text-right">Imobilizado</th>
                    <th className="p-4 text-right">Total Vendido</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                  {relatorioEstoque.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-800/30">
                      <td className="p-4 text-center font-bold">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                          item.classe_abc === 'A'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : item.classe_abc === 'B'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {item.classe_abc}
                        </span>
                      </td>

                      <td className="p-4">
                        <p className="font-semibold text-zinc-200">{item.nome}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{item.codigo}</p>
                      </td>

                      <td className="p-4 text-zinc-400">{item.marca}</td>

                      <td className="p-4 text-center font-mono font-semibold">
                        {item.quantidade_estoque}{' '}
                        <span className="text-[10px] text-zinc-500 font-normal">
                          / {item.estoque_minimo} min
                        </span>
                      </td>

                      <td className="p-4 text-right font-mono text-zinc-400">
                        R$ {item.preco_custo.toFixed(2)}
                      </td>

                      <td className="p-4 text-right font-mono font-semibold text-zinc-200">
                        R$ {item.preco_venda.toFixed(2)}
                      </td>

                      <td className="p-4 text-right font-mono font-bold text-zinc-200">
                        R$ {item.valor_total_imobilizado.toFixed(2)}
                      </td>

                      <td className="p-4 text-right font-mono font-bold text-emerald-400">
                        R$ {item.total_vendido_valor.toFixed(2)}
                      </td>

                      <td className="p-4 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          item.status_estoque === 'zerado'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : item.status_estoque === 'baixo'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-emerald-950/60 text-emerald-400'
                        }`}>
                          {item.status_estoque}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
