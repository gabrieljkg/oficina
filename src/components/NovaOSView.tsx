import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Car,
  User,
  Wrench,
  Package,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  UserPlus,
  Gauge,
  Calendar,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { dbStore } from '../lib/dbStore';
import { Cliente, Veiculo, ProdutoPeca, ServicoMaoDeObra, StatusOS, OrdemServico } from '../types/database';
import { QuickClienteModal } from './QuickClienteModal';
import { QuickVeiculoModal } from './QuickVeiculoModal';
import { QuickPecaModal } from './QuickPecaModal';
import { QuickServicoModal } from './QuickServicoModal';
import { OSPrintModal } from './OSPrintModal';

interface NovaOSViewProps {
  onOSCreatedSuccess?: (os: OrdemServico) => void;
}

interface ItemPecaForm {
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

interface ItemServicoForm {
  servico_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export const NovaOSView: React.FC<NovaOSViewProps> = ({ onOSCreatedSuccess }) => {
  // State from DB
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [produtos, setProdutos] = useState<ProdutoPeca[]>([]);
  const [servicos, setServicos] = useState<ServicoMaoDeObra[]>([]);

  // Selection state
  const [clienteSearch, setClienteSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);

  // Form Fields
  const [kmEntrada, setKmEntrada] = useState<number | ''>('');
  const [mecanicoResp, setMecanicoResp] = useState('Marcos Roberto (Box 2)');
  const [previsaoEntrega, setPrevisaoEntrega] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [status, setStatus] = useState<StatusOS>('orcamento');
  const [observacoes, setObservacoes] = useState('');
  const [desconto, setDesconto] = useState<number | ''>('');

  // Selected Parts & Services Lists
  const [itensPecas, setItensPecas] = useState<ItemPecaForm[]>([]);
  const [itensServicos, setItensServicos] = useState<ItemServicoForm[]>([]);

  // Modals state
  const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);
  const [isVeiculoModalOpen, setIsVeiculoModalOpen] = useState(false);
  const [isPecaModalOpen, setIsPecaModalOpen] = useState(false);
  const [isServicoModalOpen, setIsServicoModalOpen] = useState(false);
  const [createdOSToPrint, setCreatedOSToPrint] = useState<OrdemServico | null>(null);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Temporary selectors for adding parts/services
  const [tempPecaId, setTempPecaId] = useState('');
  const [tempPecaQtd, setTempPecaQtd] = useState(1);
  const [tempPecaSearch, setTempPecaSearch] = useState('');

  const [tempServicoId, setTempServicoId] = useState('');
  const [tempServicoQtd, setTempServicoQtd] = useState(1);
  const [tempServicoSearch, setTempServicoSearch] = useState('');

  // Reload data
  const loadData = () => {
    setClientes(dbStore.getClientes());
    setVeiculos(dbStore.getVeiculos());
    setProdutos(dbStore.getProdutos());
    setServicos(dbStore.getServicos());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbStore.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  // Update vehicle selection options when client changes
  const veiculosDoCliente = selectedCliente
    ? veiculos.filter((v) => v.cliente_id === selectedCliente.id)
    : [];

  const handleSelectCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setClienteSearch(cliente.nome);
    setShowClienteDropdown(false);
    // Find customer vehicles
    const clientVehicles = veiculos.filter((v) => v.cliente_id === cliente.id);
    if (clientVehicles.length > 0) {
      setSelectedVeiculo(clientVehicles[0]);
      setKmEntrada(clientVehicles[0].km_atual || '');
    } else {
      setSelectedVeiculo(null);
      setKmEntrada('');
    }
  };

  const handleSelectVeiculo = (veiculo: Veiculo) => {
    setSelectedVeiculo(veiculo);
    setKmEntrada(veiculo.km_atual || '');
    // If client not already selected, select it
    if (!selectedCliente || selectedCliente.id !== veiculo.cliente_id) {
      const c = clientes.find((x) => x.id === veiculo.cliente_id);
      if (c) {
        setSelectedCliente(c);
        setClienteSearch(c.nome);
      }
    }
  };

  // Add Part handler
  const handleAddPeca = () => {
    if (!tempPecaId) return;
    const prod = produtos.find((p) => p.id === tempPecaId);
    if (!prod) return;

    // Check if already in list
    const existingIndex = itensPecas.findIndex((item) => item.produto_id === tempPecaId);
    if (existingIndex >= 0) {
      const updated = [...itensPecas];
      updated[existingIndex].quantidade += tempPecaQtd;
      updated[existingIndex].subtotal = updated[existingIndex].quantidade * updated[existingIndex].preco_unitario;
      setItensPecas(updated);
    } else {
      const preco_unitario = prod.preco_venda;
      setItensPecas([
        ...itensPecas,
        {
          produto_id: prod.id,
          quantidade: tempPecaQtd,
          preco_unitario,
          subtotal: tempPecaQtd * preco_unitario,
        },
      ]);
    }
    setTempPecaId('');
    setTempPecaQtd(1);
    setTempPecaSearch('');
  };

  const handleRemovePeca = (index: number) => {
    setItensPecas(itensPecas.filter((_, i) => i !== index));
  };

  // Add Service handler
  const handleAddServico = () => {
    if (!tempServicoId) return;
    const srv = servicos.find((s) => s.id === tempServicoId);
    if (!srv) return;

    const existingIndex = itensServicos.findIndex((item) => item.servico_id === tempServicoId);
    if (existingIndex >= 0) {
      const updated = [...itensServicos];
      updated[existingIndex].quantidade += tempServicoQtd;
      updated[existingIndex].subtotal = updated[existingIndex].quantidade * updated[existingIndex].preco_unitario;
      setItensServicos(updated);
    } else {
      const preco_unitario = srv.preco_base;
      setItensServicos([
        ...itensServicos,
        {
          servico_id: srv.id,
          quantidade: tempServicoQtd,
          preco_unitario,
          subtotal: tempServicoQtd * preco_unitario,
        },
      ]);
    }
    setTempServicoId('');
    setTempServicoQtd(1);
    setTempServicoSearch('');
  };

  const handleRemoveServico = (index: number) => {
    setItensServicos(itensServicos.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotalPecas = itensPecas.reduce((sum, item) => sum + item.subtotal, 0);
  const subtotalServicos = itensServicos.reduce((sum, item) => sum + item.subtotal, 0);
  const valDesconto = Number(desconto) || 0;
  const valorTotal = Math.max(0, subtotalPecas + subtotalServicos - valDesconto);

  // Submit OS
  const handleSubmitOS = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedCliente) {
      setErrorMsg('Selecione ou cadastre um cliente para esta OS.');
      return;
    }
    if (!selectedVeiculo) {
      setErrorMsg('Selecione ou cadastre um veículo vinculado ao cliente.');
      return;
    }
    if (itensPecas.length === 0 && itensServicos.length === 0) {
      setErrorMsg('Adicione pelo menos 1 peça ou 1 serviço de mão de obra à Ordem de Serviço.');
      return;
    }

    try {
      setLoading(true);
      const novaOS = await dbStore.createOrdemServico({
        cliente_id: selectedCliente.id,
        veiculo_id: selectedVeiculo.id,
        status,
        observacoes,
        km_entrada: Number(kmEntrada) || selectedVeiculo.km_atual || 0,
        mecanico_responsavel: mecanicoResp,
        previsao_entrega: previsaoEntrega,
        desconto: valDesconto,
        itens_pecas: itensPecas.map((p) => ({
          produto_id: p.produto_id,
          quantidade: p.quantidade,
          preco_unitario: p.preco_unitario,
        })),
        itens_servicos: itensServicos.map((s) => ({
          servico_id: s.servico_id,
          quantidade: s.quantidade,
          preco_unitario: s.preco_unitario,
        })),
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });

      setSuccessMsg(`Ordem de Serviço #${novaOS.numero_os} criada com sucesso!`);
      setCreatedOSToPrint(novaOS);

      if (onOSCreatedSuccess) {
        onOSCreatedSuccess(novaOS);
      }

      // Reset form
      setItensPecas([]);
      setItensServicos([]);
      setObservacoes('');
      setDesconto('');
      setStatus('orcamento');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao gerar Ordem de Serviço');
    } finally {
      setLoading(false);
    }
  };

  // Filtered clients for predictive search
  const filteredClientes = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(clienteSearch.toLowerCase()) ||
      c.telefone.includes(clienteSearch) ||
      (c.cpf_cnpj && c.cpf_cnpj.includes(clienteSearch))
  );

  // Filtered parts and services for selection
  const filteredProdutos = produtos.filter((p) =>
    p.nome_peca.toLowerCase().includes(tempPecaSearch.toLowerCase()) ||
    p.codigo.toLowerCase().includes(tempPecaSearch.toLowerCase())
  );

  const filteredServicos = servicos.filter((s) =>
    s.nome_servico.toLowerCase().includes(tempServicoSearch.toLowerCase()) ||
    s.codigo.toLowerCase().includes(tempServicoSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
            <Wrench className="h-6 w-6 text-blue-500" />
            Nova Ordem de Serviço (OS)
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Abra um orçamento ou ordem de trabalho com peças, mão de obra e cálculo automático.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsClienteModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-800 border border-zinc-700/80 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
          >
            <UserPlus className="h-4 w-4 text-blue-400" />
            + Novo Cliente
          </button>
          <button
            type="button"
            onClick={() => setIsVeiculoModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-800 border border-zinc-700/80 px-3.5 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
          >
            <Car className="h-4 w-4 text-emerald-400" />
            + Novo Veículo
          </button>
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-400 text-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">{successMsg}</p>
              <p className="text-xs text-emerald-500">A OS foi gravada no banco e o estoque das peças atualizado.</p>
            </div>
          </div>
          {createdOSToPrint && (
            <button
              onClick={() => setCreatedOSToPrint(createdOSToPrint)}
              className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm"
            >
              Imprimir OS
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmitOS} className="space-y-6">
        {/* BLOCO 1: IDENTIFICAÇÃO DO CLIENTE E VEÍCULO */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800/80 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
              <User className="h-4 w-4 text-blue-400" />
              1. Cliente & Veículo
            </div>
            <span className="text-xs text-zinc-400">Busca preditiva integrada</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campo Cliente com Busca Preditiva */}
            <div className="relative space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Buscar Cliente (Nome, CPF ou Telefone) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={clienteSearch}
                  onChange={(e) => {
                    setClienteSearch(e.target.value);
                    setShowClienteDropdown(true);
                    if (selectedCliente && e.target.value !== selectedCliente.nome) {
                      setSelectedCliente(null);
                    }
                  }}
                  onFocus={() => setShowClienteDropdown(true)}
                  placeholder="Digite para pesquisar cliente..."
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                />
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
              </div>

              {/* Dropdown preditivo */}
              {showClienteDropdown && filteredClientes.length > 0 && (
                <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl divide-y divide-zinc-800/60">
                  {filteredClientes.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCliente(c)}
                      className="p-3 hover:bg-zinc-800/50 cursor-pointer transition flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-zinc-100">{c.nome}</p>
                        <p className="text-zinc-400">{c.telefone} {c.cpf_cnpj ? `• ${c.cpf_cnpj}` : ''}</p>
                      </div>
                      <span className="text-blue-400 font-medium text-[11px]">Selecionar</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedCliente && (
                <div className="mt-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-zinc-300 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-blue-400">{selectedCliente.nome}</span>
                    <p className="text-zinc-400">{selectedCliente.telefone} • {selectedCliente.email || 'Sem email'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCliente(null);
                      setClienteSearch('');
                      setSelectedVeiculo(null);
                    }}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    Trocar
                  </button>
                </div>
              )}
            </div>

            {/* Seleção do Veículo */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-300">
                  Veículo do Cliente *
                </label>
                {selectedCliente && (
                  <button
                    type="button"
                    onClick={() => setIsVeiculoModalOpen(true)}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    + Cadastrar carro para este cliente
                  </button>
                )}
              </div>

              {selectedCliente ? (
                veiculosDoCliente.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {veiculosDoCliente.map((v) => {
                      const isSel = selectedVeiculo?.id === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => handleSelectVeiculo(v)}
                          className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                            isSel
                              ? 'bg-emerald-500/10 border-emerald-500 text-zinc-100'
                              : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                          }`}
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700/80 font-mono font-bold text-xs text-emerald-400">
                            {v.placa}
                          </div>
                          <div className="text-xs truncate">
                            <p className="font-semibold truncate">{v.modelo}</p>
                            <p className="text-zinc-400 text-[11px]">{v.marca} • {v.ano} • {v.km_atual.toLocaleString('pt-BR')} km</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-dashed border-zinc-800 text-center text-xs text-zinc-400">
                    Nenhum veículo cadastrado para este cliente.{' '}
                    <button
                      type="button"
                      onClick={() => setIsVeiculoModalOpen(true)}
                      className="text-emerald-400 font-semibold hover:underline"
                    >
                      Cadastrar agora
                    </button>
                  </div>
                )
              ) : (
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-500">
                  Selecione primeiro o cliente acima para carregar os veículos vinculados.
                </div>
              )}
            </div>
          </div>

          {/* Dados complementares da entrada */}
          {selectedVeiculo && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-zinc-800/80">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-zinc-400" />
                  KM de Entrada *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={kmEntrada}
                  onChange={(e) => setKmEntrada(e.target.value ? Number(e.target.value) : '')}
                  placeholder={`Atual: ${selectedVeiculo.km_atual}`}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-zinc-400" />
                  Mecânico Responsável
                </label>
                <input
                  type="text"
                  value={mecanicoResp}
                  onChange={(e) => setMecanicoResp(e.target.value)}
                  placeholder="Ex: Marcos Roberto (Box 2)"
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                  Previsão de Entrega
                </label>
                <input
                  type="date"
                  value={previsaoEntrega}
                  onChange={(e) => setPrevisaoEntrega(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* SEÇÃO 1: ADICIONAR PEÇAS DO ESTOQUE */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800/80 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
              <Package className="h-4 w-4 text-amber-400" />
              Seção 1: Peças & Produtos do Estoque
            </div>
            <button
              type="button"
              onClick={() => setIsPecaModalOpen(true)}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Cadastrar Nova Peça
            </button>
          </div>

          {/* Seletor rápido de peças */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <div className="sm:col-span-7">
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Selecione a Peça
              </label>
              <select
                value={tempPecaId}
                onChange={(e) => setTempPecaId(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="">Selecione uma peça do estoque...</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} - {p.nome_peca} (Estoque: {p.quantidade_estoque} {p.unidade}) - R$ {p.preco_venda.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Quantidade
              </label>
              <input
                type="number"
                min={1}
                value={tempPecaQtd}
                onChange={(e) => setTempPecaQtd(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none text-center"
              />
            </div>

            <div className="sm:col-span-3 flex items-end">
              <button
                type="button"
                onClick={handleAddPeca}
                disabled={!tempPecaId}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-500 transition disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Peça
              </button>
            </div>
          </div>

          {/* Tabela de Peças Selecionadas */}
          {itensPecas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 text-zinc-400 font-medium">
                  <tr>
                    <th className="pb-2">Peça</th>
                    <th className="pb-2 text-center w-20">Qtd</th>
                    <th className="pb-2 text-right w-28">Preço Unit.</th>
                    <th className="pb-2 text-right w-28">Subtotal</th>
                    <th className="pb-2 text-center w-12">Remover</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {itensPecas.map((item, idx) => {
                    const prod = produtos.find((p) => p.id === item.produto_id);
                    return (
                      <tr key={idx} className="hover:bg-zinc-800/30">
                        <td className="py-2.5">
                          <p className="font-semibold text-zinc-200">{prod?.nome_peca || 'Peça'}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{prod?.codigo} • {prod?.marca}</p>
                        </td>
                        <td className="py-2.5 text-center font-semibold text-zinc-300">
                          {item.quantidade} {prod?.unidade || 'UN'}
                        </td>
                        <td className="py-2.5 text-right font-mono text-zinc-300">
                          R$ {item.preco_unitario.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-amber-400">
                          R$ {item.subtotal.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemovePeca(idx)}
                            className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="text-right pt-2 text-xs font-semibold text-zinc-300">
                Subtotal Peças: <span className="font-mono text-amber-400">R$ {subtotalPecas.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic text-center py-2">
              Nenhuma peça adicionada ainda nesta OS.
            </p>
          )}
        </div>

        {/* SEÇÃO 2: ADICIONAR SERVIÇOS / MÃO DE OBRA */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800/80 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
              <Wrench className="h-4 w-4 text-purple-400" />
              Seção 2: Serviços & Mão de Obra
            </div>
            <button
              type="button"
              onClick={() => setIsServicoModalOpen(true)}
              className="text-xs text-purple-400 hover:underline flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Cadastrar Novo Serviço
            </button>
          </div>

          {/* Seletor rápido de serviços */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80">
            <div className="sm:col-span-7">
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Selecione o Serviço de Mão de Obra
              </label>
              <select
                value={tempServicoId}
                onChange={(e) => setTempServicoId(e.target.value)}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:border-purple-500 focus:outline-none"
              >
                <option value="">Selecione o tipo de mão de obra...</option>
                {servicos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.codigo} - {s.nome_servico} (~{s.tempo_estimado_min}min) - R$ {s.preco_base.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Quantidade
              </label>
              <input
                type="number"
                min={1}
                value={tempServicoQtd}
                onChange={(e) => setTempServicoQtd(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:border-purple-500 focus:outline-none text-center"
              />
            </div>

            <div className="sm:col-span-3 flex items-end">
              <button
                type="button"
                onClick={handleAddServico}
                disabled={!tempServicoId}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Serviço
              </button>
            </div>
          </div>

          {/* Tabela de Serviços Selecionados */}
          {itensServicos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 text-zinc-400 font-medium">
                  <tr>
                    <th className="pb-2">Serviço / Mão de Obra</th>
                    <th className="pb-2 text-center w-20">Qtd</th>
                    <th className="pb-2 text-right w-28">Preço Unit.</th>
                    <th className="pb-2 text-right w-28">Subtotal</th>
                    <th className="pb-2 text-center w-12">Remover</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {itensServicos.map((item, idx) => {
                    const srv = servicos.find((s) => s.id === item.servico_id);
                    return (
                      <tr key={idx} className="hover:bg-zinc-800/30">
                        <td className="py-2.5">
                          <p className="font-semibold text-zinc-200">{srv?.nome_servico || 'Serviço'}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{srv?.codigo} • {srv?.categoria}</p>
                        </td>
                        <td className="py-2.5 text-center font-semibold text-zinc-300">
                          {item.quantidade}x
                        </td>
                        <td className="py-2.5 text-right font-mono text-zinc-300">
                          R$ {item.preco_unitario.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-right font-mono font-bold text-purple-400">
                          R$ {item.subtotal.toFixed(2)}
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveServico(idx)}
                            className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="text-right pt-2 text-xs font-semibold text-zinc-300">
                Subtotal Mão de Obra: <span className="font-mono text-purple-400">R$ {subtotalServicos.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic text-center py-2">
              Nenhum serviço de mão de obra adicionado.
            </p>
          )}
        </div>

        {/* SEÇÃO 3: OBSERVAÇÕES / SINTOMAS E STATUS DA OS */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800/80 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
              <FileText className="h-4 w-4 text-emerald-400" />
              Seção 3: Observações, Sintomas & Status
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Observações Técnicas / Relato do Cliente / Sintomas do Carro
              </label>
              <textarea
                rows={4}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Descreva o que o cliente relatou (ruídos, falhas, luz de injeção acesa, revisão preventiva, etc.)..."
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Status Inicial da OS *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusOS)}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-xs font-semibold text-zinc-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="orcamento">Orçamento (Aguardando Aprovação)</option>
                  <option value="aprovado">Aprovado pelo Cliente</option>
                  <option value="em_execucao">Em Execução no Box</option>
                  <option value="concluido">Concluído (Pronto p/ Retirada)</option>
                  <option value="pago">Pago / Finalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Desconto (R$)</span>
                  <span className="text-[10px] text-zinc-500">Opcional</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={desconto}
                  onChange={(e) => setDesconto(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0.00"
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RODAPÉ: RESUMO DE TOTAIS E BOTÃO DE SALVAMENTO */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl sticky bottom-4 z-20 backdrop-blur-md bg-zinc-900/95">
          <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-400 w-full sm:w-auto">
            <div>
              <p className="text-zinc-500">Subtotal Peças</p>
              <p className="text-sm font-semibold font-mono text-amber-400">
                R$ {subtotalPecas.toFixed(2)}
              </p>
            </div>
            <div className="h-8 w-px bg-zinc-800 hidden sm:block" />
            <div>
              <p className="text-zinc-500">Subtotal Serviços</p>
              <p className="text-sm font-semibold font-mono text-purple-400">
                R$ {subtotalServicos.toFixed(2)}
              </p>
            </div>
            {valDesconto > 0 && (
              <>
                <div className="h-8 w-px bg-zinc-800 hidden sm:block" />
                <div>
                  <p className="text-zinc-500">Desconto</p>
                  <p className="text-sm font-semibold font-mono text-emerald-400">
                    - R$ {valDesconto.toFixed(2)}
                  </p>
                </div>
              </>
            )}
            <div className="h-8 w-px bg-zinc-800 hidden sm:block" />
            <div>
              <p className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                Valor Total da OS
              </p>
              <p className="text-xl font-bold font-mono text-zinc-100">
                R$ {valorTotal.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? (
                <span>Gravando OS...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Salvar Ordem de Serviço
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Modais de Cadastro Rápido */}
      <QuickClienteModal
        isOpen={isClienteModalOpen}
        onClose={() => setIsClienteModalOpen(false)}
        onClienteCreated={(c) => {
          handleSelectCliente(c);
          setIsVeiculoModalOpen(true); // sugere cadastrar o veículo em seguida
        }}
      />

      <QuickVeiculoModal
        isOpen={isVeiculoModalOpen}
        clienteIdPreSelected={selectedCliente?.id}
        onClose={() => setIsVeiculoModalOpen(false)}
        onVeiculoCreated={(v) => {
          handleSelectVeiculo(v);
        }}
      />

      <QuickPecaModal
        isOpen={isPecaModalOpen}
        onClose={() => setIsPecaModalOpen(false)}
        onPecaCreated={(p) => {
          setTempPecaId(p.id);
        }}
      />

      <QuickServicoModal
        isOpen={isServicoModalOpen}
        onClose={() => setIsServicoModalOpen(false)}
        onServicoCreated={(s) => {
          setTempServicoId(s.id);
        }}
      />

      {/* Modal de Impressão */}
      <OSPrintModal
        os={createdOSToPrint}
        isOpen={Boolean(createdOSToPrint)}
        onClose={() => setCreatedOSToPrint(null)}
      />
    </div>
  );
};
