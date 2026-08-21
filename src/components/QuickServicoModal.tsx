import React, { useState } from 'react';
import { X, Wrench, DollarSign, Clock } from 'lucide-react';
import { dbStore } from '../lib/dbStore';
import { ServicoMaoDeObra } from '../types/database';

interface QuickServicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServicoCreated?: (servico: ServicoMaoDeObra) => void;
}

export const QuickServicoModal: React.FC<QuickServicoModalProps> = ({
  isOpen,
  onClose,
  onServicoCreated,
}) => {
  const [nomeServico, setNomeServico] = useState('');
  const [precoBase, setPrecoBase] = useState<number | ''>('');
  const [tempoEstimado, setTempoEstimado] = useState<number | ''>(60);
  const [categoria, setCategoria] = useState('Mecânica Geral');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeServico.trim()) {
      setError('O nome do serviço é obrigatório.');
      return;
    }
    if (!precoBase || Number(precoBase) <= 0) {
      setError('O valor base do serviço deve ser maior que zero.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const novo = await dbStore.createServico({
        codigo: '',
        nome_servico: nomeServico,
        preco_base: Number(precoBase),
        tempo_estimado_min: Number(tempoEstimado) || 60,
        categoria,
      });

      if (onServicoCreated) {
        onServicoCreated(novo);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao cadastrar serviço');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl text-zinc-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/20">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Novo Serviço / Mão de Obra</h3>
              <p className="text-xs text-zinc-400">Cadastre serviço da tabela de oficina</p>
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
              Descrição do Serviço *
            </label>
            <input
              type="text"
              required
              value={nomeServico}
              onChange={(e) => setNomeServico(e.target.value)}
              placeholder="Ex: Troca de Correia Dentada ou Geometria 3D"
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Categoria do Serviço
            </label>
            <input
              type="text"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ex: Motor, Suspensão, Injeção Eletrônica"
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                Valor Mão de Obra (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                min={0}
                value={precoBase}
                onChange={(e) => setPrecoBase(e.target.value ? Number(e.target.value) : '')}
                placeholder="0.00"
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-emerald-400 font-semibold focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                Tempo Est. (minutos)
              </label>
              <input
                type="number"
                min={5}
                step={5}
                value={tempoEstimado}
                onChange={(e) => setTempoEstimado(e.target.value ? Number(e.target.value) : '')}
                placeholder="60"
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-purple-500 focus:outline-none"
              />
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
              className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-500 transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
