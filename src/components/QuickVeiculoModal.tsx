import React, { useState, useEffect } from 'react';
import { X, Car, Gauge, Calendar, Palette, Fuel, User } from 'lucide-react';
import { dbStore } from '../lib/dbStore';
import { Veiculo, Cliente } from '../types/database';

interface QuickVeiculoModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteIdPreSelected?: string;
  onVeiculoCreated?: (veiculo: Veiculo) => void;
}

export const QuickVeiculoModal: React.FC<QuickVeiculoModalProps> = ({
  isOpen,
  onClose,
  clienteIdPreSelected,
  onVeiculoCreated,
}) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState(clienteIdPreSelected || '');
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [ano, setAno] = useState(new Date().getFullYear());
  const [cor, setCor] = useState('Prata');
  const [kmAtual, setKmAtual] = useState(0);
  const [combustivel, setCombustivel] = useState('Flex');
  const [chassi, setChassi] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setClientes(dbStore.getClientes());
    if (clienteIdPreSelected) {
      setClienteId(clienteIdPreSelected);
    }
  }, [clienteIdPreSelected, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) {
      setError('Selecione o proprietário/cliente do veículo.');
      return;
    }
    if (!placa.trim()) {
      setError('A placa do veículo é obrigatória.');
      return;
    }
    if (!modelo.trim() || !marca.trim()) {
      setError('Marca e Modelo são obrigatórios.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const formattedPlaca = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      
      const novo = await dbStore.createVeiculo({
        cliente_id: clienteId,
        placa: formattedPlaca,
        marca,
        modelo,
        ano: Number(ano),
        cor,
        km_atual: Number(kmAtual) || 0,
        combustivel,
        chassi,
      });

      if (onVeiculoCreated) {
        onVeiculoCreated(novo);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao cadastrar veículo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl text-zinc-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Cadastrar Novo Veículo</h3>
              <p className="text-xs text-zinc-400">Vincule o automóvel à ficha do cliente</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-zinc-400" />
              Proprietário / Cliente *
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              required
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Selecione um cliente cadastrado...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} - {c.telefone}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Placa do Carro * (Mercosul ou Antiga)
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                placeholder="Ex: BRA2E19 ou ABC1234"
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm font-mono tracking-wider font-semibold text-emerald-400 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5 text-zinc-400" />
                KM Atual *
              </label>
              <input
                type="number"
                required
                min={0}
                value={kmAtual}
                onChange={(e) => setKmAtual(Number(e.target.value))}
                placeholder="Ex: 48500"
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Marca / Montadora *
              </label>
              <input
                type="text"
                required
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ex: Toyota, Jeep, Fiat, VW..."
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Modelo e Versão *
              </label>
              <input
                type="text"
                required
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ex: Corolla XEi 2.0 Dynamic Force"
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                Ano
              </label>
              <input
                type="number"
                min={1970}
                max={2030}
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1">
                <Palette className="h-3.5 w-3.5 text-zinc-400" />
                Cor
              </label>
              <input
                type="text"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                placeholder="Ex: Prata"
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1">
                <Fuel className="h-3.5 w-3.5 text-zinc-400" />
                Combustível
              </label>
              <select
                value={combustivel}
                onChange={(e) => setCombustivel(e.target.value)}
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-2 py-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Flex">Flex</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Etanol">Etanol</option>
                <option value="Diesel">Diesel</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Elétrico">Elétrico</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Número do Chassi (Opcional)
            </label>
            <input
              type="text"
              value={chassi}
              onChange={(e) => setChassi(e.target.value.toUpperCase())}
              placeholder="Ex: 9BRBL48E9M8123456"
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none uppercase font-mono"
            />
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
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : 'Salvar Veículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
