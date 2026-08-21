export type StatusOS = 'orcamento' | 'aprovado' | 'em_execucao' | 'concluido' | 'pago' | 'cancelado';

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  cpf_cnpj: string;
  endereco?: string;
  cidade?: string;
  criado_em: string;
}

export interface Veiculo {
  id: string;
  cliente_id: string;
  placa: string;
  modelo: string;
  marca: string;
  ano: number;
  cor?: string;
  km_atual: number;
  combustivel?: string;
  chassi?: string;
  criado_em: string;
  // Relacionamento opcional
  cliente?: Cliente;
}

export interface ProdutoPeca {
  id: string;
  codigo: string;
  nome_peca: string;
  marca?: string;
  preco_venda: number;
  preco_custo: number;
  quantidade_estoque: number;
  estoque_minimo: number;
  unidade: string;
  categoria: string;
  criado_em: string;
}

export interface ServicoMaoDeObra {
  id: string;
  codigo: string;
  nome_servico: string;
  preco_base: number;
  tempo_estimado_min: number;
  categoria: string;
  criado_em: string;
}

export interface ItemOSPeca {
  id: string;
  os_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  // Relacionamento
  produto?: ProdutoPeca;
}

export interface ItemOSServico {
  id: string;
  os_id: string;
  servico_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  // Relacionamento
  servico?: ServicoMaoDeObra;
}

export interface OrdemServico {
  id: string;
  numero_os: number;
  cliente_id: string;
  veiculo_id: string;
  status: StatusOS;
  valor_total: number;
  valor_pecas: number;
  valor_servicos: number;
  desconto: number;
  observacoes?: string;
  km_entrada: number;
  mecanico_responsavel?: string;
  previsao_entrega?: string;
  concluido_em?: string;
  criado_em: string;
  atualizado_em?: string;

  // Relacionamentos expandidos
  cliente?: Cliente;
  veiculo?: Veiculo;
  itens_pecas?: ItemOSPeca[];
  itens_servicos?: ItemOSServico[];
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

export interface ResumoDashboard {
  totalOS: number;
  osAbertas: number;
  osEmExecucao: number;
  osConcluidasMes: number;
  faturamentoMes: number;
  faturamentoPendente: number;
  ticketMedio: number;
  servicosMaisRealizados: { nome: string; quantidade: number; total: number }[];
  pecasMaisUtilizadas: { nome: string; quantidade: number; total: number }[];
  osRecentes: OrdemServico[];
  carrosNoPatio: number;
}
