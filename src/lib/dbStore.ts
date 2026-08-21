import { Cliente, Veiculo, ProdutoPeca, ServicoMaoDeObra, OrdemServico, ItemOSPeca, ItemOSServico, StatusOS, ResumoDashboard } from '../types/database';
import { SEED_CLIENTES, SEED_VEICULOS, SEED_PRODUTOS, SEED_SERVICOS, SEED_ORDENS_SERVICO } from './mockData';
import { getSupabase } from './supabase';

const LS_PREFIX = 'autofix_db_';
const LS_KEYS = {
  CLIENTES: `${LS_PREFIX}clientes`,
  VEICULOS: `${LS_PREFIX}veiculos`,
  PRODUTOS: `${LS_PREFIX}produtos`,
  SERVICOS: `${LS_PREFIX}servicos`,
  ORDENS: `${LS_PREFIX}ordens`,
};

function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Erro ao salvar ${key} no localStorage`, e);
  }
}

class DatabaseStore {
  private listeners: Set<() => void> = new Set();
  public loading: boolean = false;
  public lastError: string | null = null;

  private clientes: Cliente[] = [];
  private veiculos: Veiculo[] = [];
  private produtos: ProdutoPeca[] = [];
  private servicos: ServicoMaoDeObra[] = [];
  private ordens: OrdemServico[] = [];

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData() {
    this.clientes = getLocal<Cliente[]>(LS_KEYS.CLIENTES, SEED_CLIENTES);
    this.veiculos = getLocal<Veiculo[]>(LS_KEYS.VEICULOS, SEED_VEICULOS);
    this.produtos = getLocal<ProdutoPeca[]>(LS_KEYS.PRODUTOS, SEED_PRODUTOS);
    this.servicos = getLocal<ServicoMaoDeObra[]>(LS_KEYS.SERVICOS, SEED_SERVICOS);
    this.ordens = getLocal<OrdemServico[]>(LS_KEYS.ORDENS, SEED_ORDENS_SERVICO);

    // Se estiver conectado com o Supabase, tenta puxar do servidor
    const supabase = getSupabase();
    if (supabase) {
      this.syncFromSupabase();
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  private persistLocal() {
    setLocal(LS_KEYS.CLIENTES, this.clientes);
    setLocal(LS_KEYS.VEICULOS, this.veiculos);
    setLocal(LS_KEYS.PRODUTOS, this.produtos);
    setLocal(LS_KEYS.SERVICOS, this.servicos);
    setLocal(LS_KEYS.ORDENS, this.ordens);
    this.notify();
  }

  public async syncFromSupabase(): Promise<{ success: boolean; message?: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: 'Supabase não configurado' };
    }

    try {
      this.loading = true;
      this.notify();

      const [resClientes, resVeiculos, resProdutos, resServicos, resOrdens] = await Promise.all([
        supabase.from('clientes').select('*').order('criado_em', { ascending: false }),
        supabase.from('veiculos').select('*'),
        supabase.from('produtos_pecas').select('*'),
        supabase.from('servicos_mao_de_obra').select('*'),
        supabase.from('ordens_servico').select(`
          *,
          cliente:clientes(*),
          veiculo:veiculos(*),
          itens_pecas:itens_os_pecas(*, produto:produtos_pecas(*)),
          itens_servicos:itens_os_servicos(*, servico:servicos_mao_de_obra(*))
        `).order('criado_em', { ascending: false })
      ]);

      if (resClientes.data && resClientes.data.length > 0) this.clientes = resClientes.data;
      if (resVeiculos.data && resVeiculos.data.length > 0) this.veiculos = resVeiculos.data;
      if (resProdutos.data && resProdutos.data.length > 0) this.produtos = resProdutos.data;
      if (resServicos.data && resServicos.data.length > 0) this.servicos = resServicos.data;
      if (resOrdens.data && resOrdens.data.length > 0) this.ordens = resOrdens.data;

      this.persistLocal();
      this.lastError = null;
      return { success: true };
    } catch (err: any) {
      console.warn('Erro ao sincronizar com Supabase, mantendo dados locais:', err);
      this.lastError = err?.message || 'Falha ao sincronizar com o Supabase';
      return { success: false, message: this.lastError || '' };
    } finally {
      this.loading = false;
      this.notify();
    }
  }

  // Clientes
  public getClientes(): Cliente[] {
    return this.clientes;
  }

  public getClienteById(id: string): Cliente | undefined {
    return this.clientes.find((c) => c.id === id);
  }

  public async createCliente(data: Omit<Cliente, 'id' | 'criado_em'>): Promise<Cliente> {
    const newCliente: Cliente = {
      id: crypto.randomUUID(),
      nome: data.nome.trim(),
      telefone: data.telefone.trim(),
      email: data.email.trim(),
      cpf_cnpj: data.cpf_cnpj.trim(),
      endereco: data.endereco?.trim() || '',
      cidade: data.cidade?.trim() || '',
      criado_em: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: dbData, error } = await supabase.from('clientes').insert([newCliente]).select().single();
        if (error) throw error;
        if (dbData) newCliente.id = dbData.id;
      } catch (err: any) {
        console.warn('Erro ao salvar cliente no Supabase, salvando local:', err);
      }
    }

    this.clientes.unshift(newCliente);
    this.persistLocal();
    return newCliente;
  }

  // Veículos
  public getVeiculos(): Veiculo[] {
    return this.veiculos.map((v) => ({
      ...v,
      cliente: this.getClienteById(v.cliente_id),
    }));
  }

  public getVeiculosByCliente(clienteId: string): Veiculo[] {
    return this.veiculos.filter((v) => v.cliente_id === clienteId);
  }

  public getVeiculoByPlaca(placa: string): Veiculo | undefined {
    const clean = placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const veiculo = this.veiculos.find((v) => v.placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === clean);
    if (veiculo) {
      return {
        ...veiculo,
        cliente: this.getClienteById(veiculo.cliente_id),
      };
    }
    return undefined;
  }

  public async createVeiculo(data: Omit<Veiculo, 'id' | 'criado_em' | 'cliente'>): Promise<Veiculo> {
    const newVeiculo: Veiculo = {
      id: crypto.randomUUID(),
      cliente_id: data.cliente_id,
      placa: data.placa.trim().toUpperCase(),
      modelo: data.modelo.trim(),
      marca: data.marca.trim(),
      ano: Number(data.ano),
      cor: data.cor?.trim() || 'Prata',
      km_atual: Number(data.km_atual) || 0,
      combustivel: data.combustivel?.trim() || 'Flex',
      chassi: data.chassi?.trim() || '',
      criado_em: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: dbData, error } = await supabase.from('veiculos').insert([newVeiculo]).select().single();
        if (error) throw error;
        if (dbData) newVeiculo.id = dbData.id;
      } catch (err: any) {
        console.warn('Erro ao salvar veiculo no Supabase, salvando local:', err);
      }
    }

    this.veiculos.unshift(newVeiculo);
    this.persistLocal();
    return {
      ...newVeiculo,
      cliente: this.getClienteById(newVeiculo.cliente_id),
    };
  }

  // Peças e Estoque
  public getProdutos(): ProdutoPeca[] {
    return this.produtos;
  }

  public getProdutoById(id: string): ProdutoPeca | undefined {
    return this.produtos.find((p) => p.id === id);
  }

  public async createProduto(data: Omit<ProdutoPeca, 'id' | 'criado_em'>): Promise<ProdutoPeca> {
    const newProd: ProdutoPeca = {
      id: crypto.randomUUID(),
      codigo: data.codigo || `PEC-${(this.produtos.length + 1).toString().padStart(3, '0')}`,
      nome_peca: data.nome_peca.trim(),
      marca: data.marca?.trim() || 'Original',
      preco_venda: Number(data.preco_venda),
      preco_custo: Number(data.preco_custo || data.preco_venda * 0.6),
      quantidade_estoque: Number(data.quantidade_estoque) || 0,
      estoque_minimo: Number(data.estoque_minimo) || 2,
      unidade: data.unidade || 'UN',
      categoria: data.categoria || 'Geral',
      criado_em: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: dbData, error } = await supabase.from('produtos_pecas').insert([newProd]).select().single();
        if (error) throw error;
        if (dbData) newProd.id = dbData.id;
      } catch (err: any) {
        console.warn('Erro ao salvar produto no Supabase:', err);
      }
    }

    this.produtos.unshift(newProd);
    this.persistLocal();
    return newProd;
  }

  public async updateEstoque(produtoId: string, deltaQuantidade: number) {
    const prod = this.produtos.find((p) => p.id === produtoId);
    if (prod) {
      prod.quantidade_estoque = Math.max(0, prod.quantidade_estoque + deltaQuantidade);
      this.persistLocal();

      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('produtos_pecas').update({ quantidade_estoque: prod.quantidade_estoque }).eq('id', produtoId);
        } catch (e) {
          console.warn('Falha ao atualizar estoque no Supabase:', e);
        }
      }
    }
  }

  // Serviços de Mão de Obra
  public getServicos(): ServicoMaoDeObra[] {
    return this.servicos;
  }

  public getServicoById(id: string): ServicoMaoDeObra | undefined {
    return this.servicos.find((s) => s.id === id);
  }

  public async createServico(data: Omit<ServicoMaoDeObra, 'id' | 'criado_em'>): Promise<ServicoMaoDeObra> {
    const newServ: ServicoMaoDeObra = {
      id: crypto.randomUUID(),
      codigo: data.codigo || `SRV-${(this.servicos.length + 1).toString().padStart(3, '0')}`,
      nome_servico: data.nome_servico.trim(),
      preco_base: Number(data.preco_base),
      tempo_estimado_min: Number(data.tempo_estimado_min) || 60,
      categoria: data.categoria || 'Mecânica Geral',
      criado_em: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: dbData, error } = await supabase.from('servicos_mao_de_obra').insert([newServ]).select().single();
        if (error) throw error;
        if (dbData) newServ.id = dbData.id;
      } catch (err: any) {
        console.warn('Erro ao salvar serviço no Supabase:', err);
      }
    }

    this.servicos.unshift(newServ);
    this.persistLocal();
    return newServ;
  }

  // Ordens de Serviço (OS)
  public getOrdens(): OrdemServico[] {
    return this.ordens.map((os) => this.expandOrdem(os));
  }

  public getOrdemById(id: string): OrdemServico | undefined {
    const os = this.ordens.find((o) => o.id === id || String(o.numero_os) === String(id));
    if (!os) return undefined;
    return this.expandOrdem(os);
  }

  private expandOrdem(os: OrdemServico): OrdemServico {
    const cliente = this.getClienteById(os.cliente_id);
    const veiculo = this.veiculos.find((v) => v.id === os.veiculo_id);
    const itens_pecas = (os.itens_pecas || []).map((item) => ({
      ...item,
      produto: this.getProdutoById(item.produto_id),
    }));
    const itens_servicos = (os.itens_servicos || []).map((item) => ({
      ...item,
      servico: this.getServicoById(item.servico_id),
    }));

    return {
      ...os,
      cliente,
      veiculo: veiculo ? { ...veiculo, cliente } : undefined,
      itens_pecas,
      itens_servicos,
    };
  }

  public async createOrdemServico(params: {
    cliente_id: string;
    veiculo_id: string;
    status: StatusOS;
    observacoes?: string;
    km_entrada: number;
    mecanico_responsavel?: string;
    previsao_entrega?: string;
    desconto?: number;
    itens_pecas: { produto_id: string; quantidade: number; preco_unitario: number }[];
    itens_servicos: { servico_id: string; quantidade: number; preco_unitario: number }[];
  }): Promise<OrdemServico> {
    const osId = crypto.randomUUID();
    const maxNumero = this.ordens.reduce((max, o) => Math.max(max, o.numero_os || 0), 1000);
    const numero_os = maxNumero + 1;

    const valor_pecas = params.itens_pecas.reduce((acc, item) => acc + item.quantidade * item.preco_unitario, 0);
    const valor_servicos = params.itens_servicos.reduce((acc, item) => acc + item.quantidade * item.preco_unitario, 0);
    const desconto = Number(params.desconto) || 0;
    const valor_total = Math.max(0, valor_pecas + valor_servicos - desconto);

    const itensPecasParsed: ItemOSPeca[] = params.itens_pecas.map((p) => ({
      id: crypto.randomUUID(),
      os_id: osId,
      produto_id: p.produto_id,
      quantidade: p.quantidade,
      preco_unitario: p.preco_unitario,
      subtotal: p.quantidade * p.preco_unitario,
    }));

    const itensServicosParsed: ItemOSServico[] = params.itens_servicos.map((s) => ({
      id: crypto.randomUUID(),
      os_id: osId,
      servico_id: s.servico_id,
      quantidade: s.quantidade,
      preco_unitario: s.preco_unitario,
      subtotal: s.quantidade * s.preco_unitario,
    }));

    const novaOS: OrdemServico = {
      id: osId,
      numero_os,
      cliente_id: params.cliente_id,
      veiculo_id: params.veiculo_id,
      status: params.status,
      valor_total,
      valor_pecas,
      valor_servicos,
      desconto,
      observacoes: params.observacoes || '',
      km_entrada: Number(params.km_entrada) || 0,
      mecanico_responsavel: params.mecanico_responsavel || 'Mecânico Chefe',
      previsao_entrega: params.previsao_entrega || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
      itens_pecas: itensPecasParsed,
      itens_servicos: itensServicosParsed,
    };

    // Atualiza quilometragem do carro se for maior
    const veiculo = this.veiculos.find((v) => v.id === params.veiculo_id);
    if (veiculo && params.km_entrada > veiculo.km_atual) {
      veiculo.km_atual = params.km_entrada;
    }

    // Deduz estoque para as peças utilizadas
    for (const item of params.itens_pecas) {
      await this.updateEstoque(item.produto_id, -item.quantidade);
    }

    // Tenta persistir no Supabase com inserts relacionais
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: osResult, error: osErr } = await supabase.from('ordens_servico').insert([{
          id: novaOS.id,
          numero_os: novaOS.numero_os,
          cliente_id: novaOS.cliente_id,
          veiculo_id: novaOS.veiculo_id,
          status: novaOS.status,
          valor_total: novaOS.valor_total,
          valor_pecas: novaOS.valor_pecas,
          valor_servicos: novaOS.valor_servicos,
          desconto: novaOS.desconto,
          observacoes: novaOS.observacoes,
          km_entrada: novaOS.km_entrada,
          mecanico_responsavel: novaOS.mecanico_responsavel,
          previsao_entrega: novaOS.previsao_entrega,
        }]).select().single();

        if (osErr) throw osErr;

        // Inserts de itens em lote
        if (itensPecasParsed.length > 0) {
          await supabase.from('itens_os_pecas').insert(
            itensPecasParsed.map((p) => ({
              id: p.id,
              os_id: novaOS.id,
              produto_id: p.produto_id,
              quantidade: p.quantidade,
              preco_unitario: p.preco_unitario,
            }))
          );
        }

        if (itensServicosParsed.length > 0) {
          await supabase.from('itens_os_servicos').insert(
            itensServicosParsed.map((s) => ({
              id: s.id,
              os_id: novaOS.id,
              servico_id: s.servico_id,
              quantidade: s.quantidade,
              preco_unitario: s.preco_unitario,
            }))
          );
        }

        // Atualiza km do veiculo no Supabase
        if (params.km_entrada > 0) {
          await supabase.from('veiculos').update({ km_atual: params.km_entrada }).eq('id', params.veiculo_id);
        }
      } catch (err: any) {
        console.warn('Erro ao inserir OS completa no Supabase, mantendo local:', err);
      }
    }

    this.ordens.unshift(novaOS);
    this.persistLocal();
    return this.expandOrdem(novaOS);
  }

  public async updateStatusOS(osId: string, newStatus: StatusOS): Promise<OrdemServico | null> {
    const os = this.ordens.find((o) => o.id === osId);
    if (!os) return null;

    os.status = newStatus;
    os.atualizado_em = new Date().toISOString();
    if (newStatus === 'concluido' || newStatus === 'pago') {
      os.concluido_em = new Date().toISOString();
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('ordens_servico').update({
          status: newStatus,
          atualizado_em: os.atualizado_em,
          concluido_em: os.concluido_em || null,
        }).eq('id', osId);
      } catch (err) {
        console.warn('Erro ao atualizar status no Supabase:', err);
      }
    }

    this.persistLocal();
    return this.expandOrdem(os);
  }

  public async deleteOrdemServico(osId: string): Promise<boolean> {
    const index = this.ordens.findIndex((o) => o.id === osId);
    if (index === -1) return false;

    this.ordens.splice(index, 1);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('ordens_servico').delete().eq('id', osId);
      } catch (err) {
        console.warn('Erro ao deletar OS no Supabase:', err);
      }
    }

    this.persistLocal();
    return true;
  }

  // Histórico por Placa
  public getHistoricoPorPlaca(placa: string): {
    veiculo: Veiculo | null;
    ordens: OrdemServico[];
    totalGasto: number;
    totalVisitas: number;
    kmEvolucao: { data: string; km: number; osNumero: number }[];
    pecasSubstituidas: { nome: string; quantidade: number; total: number; data: string }[];
    servicosRealizados: { nome: string; quantidade: number; total: number; data: string }[];
  } {
    const veiculo = this.getVeiculoByPlaca(placa);
    if (!veiculo) {
      return {
        veiculo: null,
        ordens: [],
        totalGasto: 0,
        totalVisitas: 0,
        kmEvolucao: [],
        pecasSubstituidas: [],
        servicosRealizados: [],
      };
    }

    const ordensDoVeiculo = this.ordens
      .filter((o) => o.veiculo_id === veiculo.id)
      .map((o) => this.expandOrdem(o))
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

    const totalGasto = ordensDoVeiculo
      .filter((o) => o.status !== 'cancelado')
      .reduce((acc, o) => acc + o.valor_total, 0);

    const kmEvolucao = ordensDoVeiculo
      .filter((o) => o.km_entrada > 0)
      .map((o) => ({
        data: new Date(o.criado_em).toLocaleDateString('pt-BR'),
        km: o.km_entrada,
        osNumero: o.numero_os,
      }))
      .reverse();

    const pecasMap: { [key: string]: { nome: string; quantidade: number; total: number; data: string } } = {};
    const servicosMap: { [key: string]: { nome: string; quantidade: number; total: number; data: string } } = {};

    ordensDoVeiculo.forEach((os) => {
      if (os.status !== 'cancelado') {
        const dataStr = new Date(os.criado_em).toLocaleDateString('pt-BR');
        os.itens_pecas?.forEach((item) => {
          const nome = item.produto?.nome_peca || 'Peça diversa';
          if (!pecasMap[nome]) {
            pecasMap[nome] = { nome, quantidade: 0, total: 0, data: dataStr };
          }
          pecasMap[nome].quantidade += item.quantidade;
          pecasMap[nome].total += item.subtotal;
        });

        os.itens_servicos?.forEach((item) => {
          const nome = item.servico?.nome_servico || 'Mão de obra';
          if (!servicosMap[nome]) {
            servicosMap[nome] = { nome, quantidade: 0, total: 0, data: dataStr };
          }
          servicosMap[nome].quantidade += item.quantidade;
          servicosMap[nome].total += item.subtotal;
        });
      }
    });

    return {
      veiculo,
      ordens: ordensDoVeiculo,
      totalGasto,
      totalVisitas: ordensDoVeiculo.length,
      kmEvolucao,
      pecasSubstituidas: Object.values(pecasMap).sort((a, b) => b.quantidade - a.quantidade),
      servicosRealizados: Object.values(servicosMap).sort((a, b) => b.quantidade - a.quantidade),
    };
  }

  // Métricas do Dashboard
  public getResumoDashboard(): ResumoDashboard {
    const totalOS = this.ordens.length;
    const osAbertas = this.ordens.filter((o) => o.status === 'orcamento' || o.status === 'aprovado').length;
    const osEmExecucao = this.ordens.filter((o) => o.status === 'em_execucao').length;
    const osConcluidasMes = this.ordens.filter((o) => o.status === 'concluido' || o.status === 'pago').length;

    const faturamentoMes = this.ordens
      .filter((o) => o.status === 'pago' || o.status === 'concluido')
      .reduce((acc, o) => acc + o.valor_total, 0);

    const faturamentoPendente = this.ordens
      .filter((o) => o.status === 'em_execucao' || o.status === 'aprovado')
      .reduce((acc, o) => acc + o.valor_total, 0);

    const ticketMedio = osConcluidasMes > 0 ? faturamentoMes / osConcluidasMes : 0;

    // Serviços mais realizados
    const srvMap: Record<string, { nome: string; quantidade: number; total: number }> = {};
    const pecaMap: Record<string, { nome: string; quantidade: number; total: number }> = {};

    this.ordens.forEach((os) => {
      os.itens_servicos?.forEach((item) => {
        const nome = item.servico?.nome_servico || 'Serviço Geral';
        if (!srvMap[nome]) srvMap[nome] = { nome, quantidade: 0, total: 0 };
        srvMap[nome].quantidade += item.quantidade;
        srvMap[nome].total += item.subtotal;
      });

      os.itens_pecas?.forEach((item) => {
        const nome = item.produto?.nome_peca || 'Peça';
        if (!pecaMap[nome]) pecaMap[nome] = { nome, quantidade: 0, total: 0 };
        pecaMap[nome].quantidade += item.quantidade;
        pecaMap[nome].total += item.subtotal;
      });
    });

    const servicosMaisRealizados = Object.values(srvMap).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);
    const pecasMaisUtilizadas = Object.values(pecaMap).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);

    const osRecentes = this.ordens.slice(0, 6).map((o) => this.expandOrdem(o));
    const carrosNoPatio = this.ordens.filter((o) => o.status === 'em_execucao' || o.status === 'aprovado' || o.status === 'concluido').length;

    return {
      totalOS,
      osAbertas,
      osEmExecucao,
      osConcluidasMes,
      faturamentoMes,
      faturamentoPendente,
      ticketMedio,
      servicosMaisRealizados,
      pecasMaisUtilizadas,
      osRecentes,
      carrosNoPatio,
    };
  }

  public resetToMockData() {
    this.clientes = [...SEED_CLIENTES];
    this.veiculos = [...SEED_VEICULOS];
    this.produtos = [...SEED_PRODUTOS];
    this.servicos = [...SEED_SERVICOS];
    this.ordens = [...SEED_ORDENS_SERVICO];
    this.persistLocal();
  }
}

export const dbStore = new DatabaseStore();
