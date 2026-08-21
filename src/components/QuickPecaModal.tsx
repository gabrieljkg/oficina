import React, { useState } from 'react';
import { X, Package, DollarSign, Layers } from 'lucide-react';
import { dbStore } from '../lib/dbStore';
import { ProdutoPeca } from '../types/database';

interface QuickPecaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPecaCreated?: (peca: ProdutoPeca) => void;
}

export const QuickPecaModal: React.FC<QuickPecaModalProps> = ({
  isOpen,
  onClose,
  onPecaCreated,
}) => {
  const [nomePeca, setNomePeca] = useState('');
  const [marca, setMarca] = useState('');
  const [precoVenda, setPrecoVenda] = useState<number | ''>('');
  const [precoCusto, setPrecoCusto] = useState<number | ''>('');
  const [quantidadeEstoque, setQuantidadeEstoque] = useState<number | ''>(10);
  const [estoqueMinimo, setEstoqueMinimo] = useState<number | ''>(2);
  const [unidade, setUnidade] = useState('UN');
  const [categoria, setCategoria] = useState('Geral');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomePeca.trim()) {
      setError('O nome da peça é obrigatório.');
      return;
    }
    if (!precoVenda || Number(precoVenda) <= 0) {
      setError('O preço de venda deve ser maior que zero.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const nova = await dbStore.createProduto({
        codigo: '',
        nome_peca: nomePeca,
        marca,
        preco_venda: Number(precoVenda),
        preco_custo: Number(precoCusto) || Number(precoVenda) * 0.6,
        quantidade_estoque: Number(quantidadeEstoque) || 0,
        estoque_minimo: Number(estoqueMinimo) || 2,
        unidade,
        categoria,
      });

      if (onPecaCreated) {
        onPecaCreated(nova);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao cadastrar peça');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl text-zinc-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/10 text-amber-400 border border-amber-500/20">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Nova Peça / Produto</h3>
              <p className="text-xs text-zinc-400">Cadastre item no estoque da oficina</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Descrição / Nome da Peça *
            </label>
            <input
              type="text"
              required
              value={nomePeca}
              onChange={(e) => setNomePeca(e.target.value)}
              placeholder="Ex: Jogo de Velas Iridium ou Óleo 5W30"
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Marca / Fabricante
              </label>
              <input
                type="text"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ex: Bosch, NGK, Cofap"
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Categoria
              </label>
              <input
                type="text"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ex: Lubrificantes, Freios"
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                Preço de Venda (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                min={0}
                value={precoVenda}
                onChange={(e) => setPrecoVenda(e.target.value ? Number(e.target.value) : '')}
                placeholder="0.00"
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-emerald-400 font-semibold focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Preço de Custo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={precoCusto}
                onChange={(e) => setPrecoCusto(e.target.value ? Number(e.target.value) : '')}
                placeholder="0.00"
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-300 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-zinc-400" />
                Estoque Inicial
              </label>
              <input
                type="number"
                min={0}
                value={quantidadeEstoque}
                onChange={(e) => setQuantidadeEstoque(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Estoque Mín.
              </label>
              <input
                type="number"
                min={1}
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Unidade
              </label>
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-2 py-2.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="UN">UN</option>
                <option value="L">L</option>
                <option value="JG">JG</option>
                <option value="PAR">PAR</option>
                <option value="KIT">KIT</option>
                <option value="KG">KG</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-500 transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Peça'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
