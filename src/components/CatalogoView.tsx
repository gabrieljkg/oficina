import React, { useState, useEffect } from 'react';
import {
  Package,
  Wrench,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  DollarSign,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { dbStore } from '../lib/dbStore';
import { ProdutoPeca, ServicoMaoDeObra } from '../types/database';
import { QuickPecaModal } from './QuickPecaModal';
import { QuickServicoModal } from './QuickServicoModal';

export const CatalogoView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pecas' | 'servicos'>('pecas');
  const [produtos, setProdutos] = useState<ProdutoPeca[]>([]);
  const [servicos, setServicos] = useState<ServicoMaoDeObra[]>([]);
  const [search, setSearch] = useState('');

  const [isPecaModalOpen, setIsPecaModalOpen] = useState(false);
  const [isServicoModalOpen, setIsServicoModalOpen] = useState(false);

  const loadData = () => {
    setProdutos(dbStore.getProdutos());
    setServicos(dbStore.getServicos());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbStore.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  const filteredProdutos = produtos.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.nome_peca.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      (p.marca && p.marca.toLowerCase().includes(q)) ||
      (p.categoria && p.categoria.toLowerCase().includes(q))
    );
  });

  const filteredServicos = servicos.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.nome_servico.toLowerCase().includes(q) ||
      s.codigo.toLowerCase().includes(q) ||
      (s.categoria && s.categoria.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
            <Package className="h-6 w-6 text-amber-500" />
            Catálogo de Peças & Mão de Obra
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Controle de estoque, tabela de preços e serviços padronizados da oficina mecânica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'pecas' ? (
            <button
              onClick={() => setIsPecaModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Nova Peça no Estoque
            </button>
          ) : (
            <button
              onClick={() => setIsServicoModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Novo Serviço / Mão de Obra
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-zinc-900 border border-zinc-800 p-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('pecas')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition flex-1 sm:flex-none justify-center ${
              activeTab === 'pecas'
                ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Package className="h-4 w-4" />
            Estoque de Peças ({produtos.length})
          </button>

          <button
            onClick={() => setActiveTab('servicos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition flex-1 sm:flex-none justify-center ${
              activeTab === 'servicos'
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wrench className="h-4 w-4" />
            Serviços & Mão de Obra ({servicos.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'pecas' ? 'Buscar peça, código ou marca...' : 'Buscar serviço ou categoria...'}
            className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
        </div>
      </div>

      {/* Tab 1: Estoque de Peças */}
      {activeTab === 'pecas' && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Descrição da Peça</th>
                  <th className="py-3 px-4">Marca / Fabricante</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4 text-center">Nível Estoque</th>
                  <th className="py-3 px-4 text-right">Preço de Custo</th>
                  <th className="py-3 px-4 text-right">Preço de Venda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredProdutos.map((p) => {
                  const isLow = p.quantidade_estoque <= p.estoque_minimo;
                  return (
                    <tr key={p.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3 px-4 font-mono font-bold text-zinc-300">{p.codigo}</td>
                      <td className="py-3 px-4 font-semibold text-zinc-100">{p.nome_peca}</td>
                      <td className="py-3 px-4 text-zinc-400">{p.marca || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800 text-zinc-300">
                          {p.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded ${
                            isLow
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {isLow && <AlertTriangle className="h-3 w-3" />}
                          {p.quantidade_estoque} {p.unidade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-500">
                        R$ {p.preco_custo.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        R$ {p.preco_venda.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Serviços & Mão de Obra */}
      {activeTab === 'servicos' && (
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Descrição do Serviço</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4 text-center">Tempo Médio Estimado</th>
                  <th className="py-3 px-4 text-right">Valor Base Mão de Obra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredServicos.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-zinc-300">{s.codigo}</td>
                    <td className="py-3 px-4 font-semibold text-zinc-100">{s.nome_servico}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {s.categoria}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-zinc-400 flex items-center justify-center gap-1 font-mono">
                      <Clock className="h-3.5 w-3.5 text-zinc-500" />
                      ~{s.tempo_estimado_min} minutos
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-purple-400">
                      R$ {s.preco_base.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modais */}
      <QuickPecaModal
        isOpen={isPecaModalOpen}
        onClose={() => setIsPecaModalOpen(false)}
      />

      <QuickServicoModal
        isOpen={isServicoModalOpen}
        onClose={() => setIsServicoModalOpen(false)}
      />
    </div>
  );
};
