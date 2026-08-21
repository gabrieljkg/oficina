import React, { useState } from 'react';
import {
  Database,
  Copy,
  Check,
  Zap,
  Terminal,
  ExternalLink,
  ShieldAlert,
  Server,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { SUPABASE_SQL_DDL } from '../sql/supabaseScript';
import { getStoredSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';
import { dbStore } from '../lib/dbStore';

export const SupabaseSqlView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState(getStoredSupabaseConfig());
  const [urlInput, setUrlInput] = useState(config.url);
  const [keyInput, setKeyInput] = useState(config.anonKey);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_DDL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    setTestResult(null);

    const saved = saveSupabaseConfig(urlInput, keyInput);
    setConfig(saved);

    if (saved.isConnected) {
      const sync = await dbStore.syncFromSupabase();
      if (sync.success) {
        setTestResult({ success: true, message: 'Conectado com sucesso ao Supabase! Tabelas sincronizadas.' });
      } else {
        setTestResult({
          success: false,
          message: sync.message || 'Falha ao sincronizar. Verifique se rodou o script SQL no SQL Editor do Supabase.',
        });
      }
    } else {
      setTestResult({ success: true, message: 'Modo local/demonstração ativado (armazenamento reativo via LocalStorage).' });
    }
    setIsTesting(false);
  };

  const handleResetData = () => {
    if (confirm('Deseja resetar os dados da aplicação para a base padrão brasileira de demonstração?')) {
      dbStore.resetToMockData();
      alert('Dados restaurados com sucesso!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <Database className="h-3 w-3" />
              Arquitetura PostgreSQL & Supabase
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">
            Script SQL & Conexão Supabase
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Execute o DDL abaixo no <strong>SQL Editor</strong> do seu painel Supabase para criar todas as tabelas relacionais, índices, triggers e RLS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 transition shadow-sm"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copiado com Sucesso!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar Script SQL (DDL)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Configuração de Credenciais & Passo a Passo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Conexão com Supabase */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
            <Server className="h-4 w-4 text-emerald-400" />
            Conectar com Projeto Real do Supabase
          </div>
          <p className="text-xs text-zinc-400">
            Insira suas credenciais da API do Supabase para sincronizar suas Ordens de Serviço diretamente na nuvem.
          </p>

          <form onSubmit={handleSaveAndConnect} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Project URL (VITE_SUPABASE_URL)
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                API Anon / Public Key (VITE_SUPABASE_ANON_KEY)
              </label>
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isTesting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Testando & Sincronizando...
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    Salvar & Testar Conexão
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs border ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </form>

          <div className="pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleResetData}
              className="text-xs text-zinc-400 hover:text-zinc-200 underline"
            >
              Restaurar dados semente de teste da oficina
            </button>
          </div>
        </div>

        {/* Instruções de Execução no Supabase (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm">
            <Terminal className="h-4 w-4 text-blue-400" />
            Como Rodar no seu Painel Supabase em 3 Passos
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
              <span className="inline-block h-6 w-6 rounded-full bg-blue-600/20 text-blue-400 text-center font-bold leading-6 text-xs">
                1
              </span>
              <p className="font-bold text-zinc-200">Acesse o SQL Editor</p>
              <p className="text-zinc-400 text-[11px]">
                No dashboard do seu projeto Supabase, clique no menu lateral na opção <strong>SQL Editor</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
              <span className="inline-block h-6 w-6 rounded-full bg-blue-600/20 text-blue-400 text-center font-bold leading-6 text-xs">
                2
              </span>
              <p className="font-bold text-zinc-200">Cole o Script DDL</p>
              <p className="text-zinc-400 text-[11px]">
                Clique no botão verde <strong>"Copiar Script SQL"</strong> e cole o código completo na aba do editor.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
              <span className="inline-block h-6 w-6 rounded-full bg-blue-600/20 text-blue-400 text-center font-bold leading-6 text-xs">
                3
              </span>
              <p className="font-bold text-zinc-200">Execute ("Run")</p>
              <p className="text-zinc-400 text-[11px]">
                Pressione <strong>Run</strong>. As tabelas, triggers de KM, índices e políticas de segurança serão criadas instantaneamente.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Code Box: Visualizador do Script SQL */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-3.5 bg-zinc-900/90 border-b border-zinc-800">
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
            <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 font-semibold text-zinc-300">schema_oficina_supabase.sql</span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        <pre className="p-6 text-xs font-mono text-zinc-300 overflow-x-auto max-h-[500px] leading-relaxed bg-zinc-950 select-all">
          {SUPABASE_SQL_DDL}
        </pre>
      </div>
    </div>
  );
};
