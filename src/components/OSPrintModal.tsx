import React from 'react';
import { X, Printer, Wrench, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { OrdemServico } from '../types/database';

interface OSPrintModalProps {
  os: OrdemServico | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OSPrintModal: React.FC<OSPrintModalProps> = ({ os, isOpen, onClose }) => {
  if (!isOpen || !os) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      orcamento: { label: 'ORÇAMENTO', bg: 'bg-zinc-100 text-zinc-800', text: 'border-zinc-300' },
      aprovado: { label: 'APROVADO', bg: 'bg-blue-50 text-blue-800', text: 'border-blue-300' },
      em_execucao: { label: 'EM EXECUÇÃO', bg: 'bg-amber-50 text-amber-800', text: 'border-amber-300' },
      concluido: { label: 'CONCLUÍDO', bg: 'bg-emerald-50 text-emerald-800', text: 'border-emerald-300' },
      pago: { label: 'PAGO / FINALIZADO', bg: 'bg-emerald-100 text-emerald-900', text: 'border-emerald-400' },
      cancelado: { label: 'CANCELADO', bg: 'bg-red-50 text-red-800', text: 'border-red-300' },
    };
    const s = map[status] || { label: status.toUpperCase(), bg: 'bg-zinc-100', text: 'border-zinc-300' };
    return <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white text-zinc-900 shadow-2xl overflow-hidden my-8 print:shadow-none print:m-0 print:rounded-none">
        {/* Top actions toolbar (hidden during print) */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 bg-zinc-50 print:hidden">
          <div className="flex items-center gap-2 text-zinc-700 font-medium text-sm">
            <Printer className="h-4 w-4 text-zinc-500" />
            Visualização de Impressão - OS #{os.numero_os}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir Documento
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable OS Document Canvas */}
        <div className="p-8 space-y-6 text-zinc-900 text-xs sm:text-sm font-sans" id="printable-os-area">
          {/* Header Oficina */}
          <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                  <Wrench className="h-5 w-5" />
                </div>
                <span className="text-xl font-black tracking-tight text-zinc-950 uppercase">
                  AutoFix Pro
                </span>
              </div>
              <p className="text-xs text-zinc-600 font-medium">Centro Automotivo & Serviços Mecânicos Especializados</p>
              <p className="text-xs text-zinc-500">CNPJ: 12.345.678/0001-90 • Inscr. Estadual: 110.234.567.890</p>
              <p className="text-xs text-zinc-500">Av. Principal das Oficinas, 1500 • Tel/WhatsApp: (11) 98765-4321</p>
            </div>

            <div className="text-right space-y-1.5">
              <div className="inline-block bg-zinc-900 text-white font-mono font-bold px-3 py-1 rounded text-base">
                ORDEM DE SERVIÇO Nº {os.numero_os}
              </div>
              <div className="pt-1">{getStatusBadge(os.status)}</div>
              <p className="text-xs text-zinc-500">
                Data Emissão: {new Date(os.criado_em).toLocaleDateString('pt-BR')} às {new Date(os.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              {os.previsao_entrega && (
                <p className="text-xs text-zinc-700 font-semibold">
                  Previsão Entrega: {new Date(os.previsao_entrega + 'T12:00:00').toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </div>

          {/* Dados do Cliente e Veículo em Grid */}
          <div className="grid grid-cols-2 gap-4 border border-zinc-300 rounded-lg p-3.5 bg-zinc-50/50">
            {/* Coluna Cliente */}
            <div className="space-y-1 border-r border-zinc-200 pr-3">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Dados do Cliente</p>
              <p className="font-bold text-zinc-900 text-sm">{os.cliente?.nome || 'Cliente não informado'}</p>
              <p className="text-zinc-600">Telefone: <span className="font-semibold text-zinc-800">{os.cliente?.telefone}</span></p>
              <p className="text-zinc-600">CPF/CNPJ: {os.cliente?.cpf_cnpj || 'Não cadastrado'}</p>
              <p className="text-zinc-600">E-mail: {os.cliente?.email || '-'}</p>
              {os.cliente?.endereco && <p className="text-zinc-500 text-xs">Endereço: {os.cliente.endereco}</p>}
            </div>

            {/* Coluna Veículo */}
            <div className="space-y-1 pl-1">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Dados do Veículo</p>
              <div className="flex items-center gap-2">
                <span className="inline-block bg-blue-900 text-white font-mono font-bold px-2.5 py-0.5 rounded text-xs tracking-wider border border-blue-950">
                  {os.veiculo?.placa || 'PLACA'}
                </span>
                <span className="font-bold text-zinc-900 text-sm">
                  {os.veiculo?.marca} {os.veiculo?.modelo}
                </span>
              </div>
              <p className="text-zinc-600">Ano: <span className="font-semibold">{os.veiculo?.ano || '-'}</span> • Cor: <span className="font-semibold">{os.veiculo?.cor || '-'}</span></p>
              <p className="text-zinc-600">KM Entrada: <span className="font-bold text-zinc-900 font-mono">{os.km_entrada.toLocaleString('pt-BR')} km</span></p>
              <p className="text-zinc-600">Mecânico Resp.: <span className="font-medium text-zinc-800">{os.mecanico_responsavel || 'Equipe Geral'}</span></p>
            </div>
          </div>

          {/* Sintomas / Observações */}
          {os.observacoes && (
            <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                Relato do Cliente / Sintomas / Diagnóstico
              </p>
              <p className="text-xs text-zinc-800 whitespace-pre-line">{os.observacoes}</p>
            </div>
          )}

          {/* Tabela de Peças Utilizadas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                1. Peças & Componentes Substituídos
              </h4>
              <span className="text-xs text-zinc-500 font-medium">
                Subtotal Peças: R$ {os.valor_pecas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <table className="w-full border-collapse border border-zinc-300 text-xs">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700">
                  <th className="border border-zinc-300 px-2 py-1.5 text-left w-16">Cód</th>
                  <th className="border border-zinc-300 px-2 py-1.5 text-left">Descrição da Peça</th>
                  <th className="border border-zinc-300 px-2 py-1.5 text-center w-14">Qtd</th>
                  <th className="border border-zinc-300 px-2 py-1.5 text-right w-24">Valor Unit.</th>
                  <th className="border border-zinc-300 px-2 py-1.5 text-right w-24">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {os.itens_pecas && os.itens_pecas.length > 0 ? (
                  os.itens_pecas.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="border border-zinc-300 px-2 py-1 text-zinc-500 font-mono">
                        {item.produto?.codigo || `P-${idx + 1}`}
                      </td>
                      <td className="border border-zinc-300 px-2 py-1 font-medium text-zinc-900">
                        {item.produto?.nome_peca || 'Peça'}
                      </td>
                      <td className="border border-zinc-300 px-2 py-1 text-center font-semibold">
                        {item.quantidade} {item.produto?.unidade || 'UN'}
                      </td>
                      <td className="border border-zinc-300 px-2 py-1 text-right text-zinc-700 font-mono">
                        R$ {item.preco_unitario.toFixed(2)}
                      </td>
                      <td className="border border-zinc-300 px-2 py-1 text-right font-semibold text-zinc-900 font-mono">
                        R$ {item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="border border-zinc-300 px-2 py-2 text-center text-zinc-400 italic">
                      Nenhuma peça aplicada nesta Ordem de Serviço.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tabela de Serviços e Mão de Obra */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                2. Serviços Especializados & Mão de Obra
              </h4>
              <span className="text-xs text-zinc-500 font-medium">
                Subtotal Mão de Obra: R$ {os.valor_servicos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <table className="w-full border-collapse border border-zinc-300 text-xs">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700">
                  <th className="border border-zinc-300 px-2 py-1.5 text-left w-16">Cód</th>
                  <th className="border border-zinc-300 px-2 py-1.5 text-left">Descrição do Serviço / Mão de Obra</th>
                  <th className="border border-zinc-300 px-2 py-1.5 text-center w-14">Qtd</th>
                  <th className="border border-zinc-300 px-2 py-1.5 text-right w-24">Valor Unit.</th>
                  <th className="border border-zinc-300 px-2 py-1.5 text-right w-24">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {os.itens_servicos && os.itens_servicos.length > 0 ? (
                  os.itens_servicos.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50">
                      <td className="border border-zinc-300 px-2 py-1 text-zinc-500 font-mono">
                        {item.servico?.codigo || `S-${idx + 1}`}
                      </td>
                      <td className="border border-zinc-300 px-2 py-1 font-medium text-zinc-900">
                        {item.servico?.nome_servico || 'Serviço'}
                      </td>
                      <td className="border border-zinc-300 px-2 py-1 text-center font-semibold">
                        {item.quantidade}
                      </td>
                      <td className="border border-zinc-300 px-2 py-1 text-right text-zinc-700 font-mono">
                        R$ {item.preco_unitario.toFixed(2)}
                      </td>
                      <td className="border border-zinc-300 px-2 py-1 text-right font-semibold text-zinc-900 font-mono">
                        R$ {item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="border border-zinc-300 px-2 py-2 text-center text-zinc-400 italic">
                      Nenhum serviço de mão de obra registrado nesta OS.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Resumo Financeiro Consolidado */}
          <div className="flex justify-end pt-2">
            <div className="w-72 border border-zinc-300 rounded-lg overflow-hidden bg-zinc-50">
              <div className="p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal Peças:</span>
                  <span className="font-mono font-medium">R$ {os.valor_pecas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal Mão de Obra:</span>
                  <span className="font-mono font-medium">R$ {os.valor_servicos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                {os.desconto > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Desconto Aplicado:</span>
                    <span className="font-mono">- R$ {os.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-zinc-300 pt-2 text-sm font-black text-zinc-950">
                  <span>VALOR TOTAL:</span>
                  <span className="font-mono text-base text-blue-700">
                    R$ {os.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Termos de Garantia e Assinaturas */}
          <div className="pt-4 border-t border-zinc-300 space-y-6">
            <div className="flex items-start gap-2 text-xs text-zinc-500 leading-relaxed bg-zinc-50 p-2.5 rounded border border-zinc-200">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Termo de Garantia Legal (Art. 26 do CDC):</strong> Todos os serviços executados e peças novas fornecidas possuem garantia legal de 90 (noventa) dias a contar da data de entrega do veículo, cobrindo eventuais defeitos de fabricação ou montagem, desde que observadas as condições normais de uso e manutenção periódica.
              </span>
            </div>

            {/* Linhas de Assinatura */}
            <div className="grid grid-cols-2 gap-12 pt-6">
              <div className="text-center space-y-1">
                <div className="border-b border-zinc-900 pb-1"></div>
                <p className="font-bold text-xs text-zinc-800 uppercase">{os.cliente?.nome || 'Assinatura do Cliente'}</p>
                <p className="text-[10px] text-zinc-500">Autorização dos Serviços & Retirada</p>
              </div>

              <div className="text-center space-y-1">
                <div className="border-b border-zinc-900 pb-1"></div>
                <p className="font-bold text-xs text-zinc-800 uppercase">AutoFix Pro - Responsável Técnico</p>
                <p className="text-[10px] text-zinc-500">{os.mecanico_responsavel || 'Mecânico Chefe'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
