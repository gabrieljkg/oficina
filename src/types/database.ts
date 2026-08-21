export type StatusOS = 'orcamento' | 'aprovado' | 'em_execucao' | 'concluido' | 'pago' | 'cancelado';

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  cpf_cnpj: string;
  endereco?: string;
  cidade?:astring;
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
  ncm?: string;
  cfop?: string;
  criado_em: string;
}

export interface ServicoMaoDeObra {
  id: string;
  codigo: string;
  nome_servico: string;
  preco_base: number;
  tempo_estimado_min: number;
  categoria: string;
  codigo_servico_municipal?: string;
  aliquota_iss?: number;
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

  // Fiscal links
  nota_fiscal_id?: string;
  nota_fiscal_status?: StatusSefaz;
  nota_fiscal_chave?: string;

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

// ----------------------------------------------------
// TIPOS FISCAIS: FOCUS NFE & SEFAZ
// ----------------------------------------------------

export type TipoNotaFiscal = 'nfe' | 'nfse' | 'nfce';
export type StatusSefaz =
  | 'processando_autorizacao'
  | 'autorizado'
  | 'rejeitado'
  | 'cancelado'
  | 'erro_autorizacao';

export type RegimeTributario = 'simples_nacional' | 'simples_excesso' | 'regime_normal' | 'mei';

export interface FocusNFeConfig {
  apiToken: string;
  ambiente: 'homologacao' | 'producao';
  isConfigured: boolean;

  // Dados da Oficina (Emitente)
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  cnae: string;
  regimeTributario: RegimeTributario;

  // Endereço do Emitente
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cep: string;
  municipio: string;
  uf: string;
  ibgeMunicipio: string;
  telefone: string;
  email: string;

  // Regras tributárias padrão
  cfopPadraoVenda: string;
  ncmPadraoAutoPecas: string;
  csosnPadrao: string;
  codigoServicoMunicipalPadrao: string;
  aliquotaIssPadrao: number;
  proximoNumeroNFe: number;
  proximoNumeroNFSe: number;
  serieNFe: number;
  serieNFSe: number;
}

export interface ItemNotaFiscal {
  id: string;
  descricao: string;
  codigo: string;
  ncm?: string;
  cfop?: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  tipo_item: 'produto' | 'servico';
  aliquota_iss?: number;
  codigo_servico?: string;
}

export interface CartaCorrecaoCCe {
  id: string;
  sequencial: number;
  data_evento: string;
  correcao: string;
  protocolo_sefaz?: string;
  status: 'autorizado' | 'rejeitado';
}

export interface NotaFiscal {
  id: string;
  os_id?: string;
  numero_os?: number;
  tipo: TipoNotaFiscal;
  numero: number;
  serie: number;
  status_sefaz: StatusSefaz;
  referencia_focus: string;
  
  // SEFAZ / Prefeitura response
  chave_acesso?: string; // 44 dígitos
  protocolo_autorizacao?: string;
  mensagem_sefaz?: string;
  codigo_status_sefaz?: string;
  motivo_rejeicao?: string;
  caminho_danfe_pdf?: string;
  caminho_xml?: string;
  xml_completo?: string;

  // Valores e Totais
  valor_total: number;
  valor_produtos: number;
  valor_servicos: number;
  valor_desconto: number;
  valor_impostos_ibpt?: number;
  valor_icms?: number;
  valor_iss?: number;

  // Dados do Destinatário (Cliente)
  cliente_id?: string;
  cliente_nome: string;
  cliente_cpf_cnpj: string;
  cliente_email?: string;
  cliente_telefone?: string;
  cliente_endereco?: string;
  cliente_cidade?: string;
  cliente_uf?: string;
  cliente_cep?: string;

  // Dados do Veículo
  veiculo_placa?: string;
  veiculo_modelo?: string;

  // Itens
  itens: ItemNotaFiscal[];
  forma_pagamento: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'boleto' | 'outros';
  natureza_operacao: string;

  // Datas
  data_emissao: string;
  data_autorizacao?: string;
  data_cancelamento?: string;
  justificativa_cancelamento?: string;

  // Eventos vinculados
  cartas_correcao?: CartaCorrecaoCCe[];
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

// ----------------------------------------------------
// TIPOS DE RELATÓRIOS
// ----------------------------------------------------

export interface FiltroPeriodoRelatorio {
  tipo: 'hoje' | 'semana' | 'mes' | 'trimestre' | 'ano' | 'personalizado';
  dataInicio: string;
  dataFim: string;
}

export interface RelatorioFiscalData {
  periodoFormatado: string;
  totalNotasEmitidas: number;
  totalNotasAutorizadas: number;
  totalNotasCanceladas: number;
  totalNotasRejeitadas: number;
  
  faturamentoTotalAutorizado: number;
  faturamentoNFePecas: number;
  faturamentoNFSeServicos: number;
  totalImpostosEstimadosIBPT: number;
  
  notas: NotaFiscal[];
}

export interface RelatorioVendasData {
  periodoFormatado: string;
  faturamentoBruto: number;
  custoTotalPecas: number;
  lucroBruto: number;
  margemLucroPercentual: number;
  ticketMedioOS: number;
  totalOrdensConcluidas: number;

  vendasPorMecanico: { mecanico: string; osConcluidas: number; totalFaturado: number; comissaoEstimada: number }[];
  categoriasMaisVendidas: { categoria: string; totalFaturado: number; percentual: number }[];
  evolucaoDiaria: { data: string; pecas: number; servicos: number; total: number }[];
}

export interface RelatorioEstoqueCurvaABCItem {
  id: string;
  codigo: string;
  nome: string;
  marca: string;
  quantidade_estoque: number;
  estoque_minimo: number;
  preco_custo: number;
  preco_venda: number;
  valor_total_imobilizado: number;
  total_vendido_quantidade: number;
  total_vendido_valor: number;
  percentual_vendas: number;
  percentual_acumulado: number;
  classe_abc: 'A' | 'B' | 'C';
  status_estoque: 'normal' | 'baixo' | 'zerado';
}

