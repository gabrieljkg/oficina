import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types/database';

const LOCAL_STORAGE_SUPABASE_KEY = 'autofix_supabase_config';

export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SUPABASE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return {
          url: parsed.url,
          anonKey: parsed.anonKey,
          isConnected: true,
        };
      }
    }
  } catch (e) {
    console.error('Erro ao ler config do Supabase do localStorage', e);
  }

  if (envUrl && envKey) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConnected: true,
    };
  }

  return {
    url: '',
    anonKey: '',
    isConnected: false,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): SupabaseConfig {
  const isConnected = Boolean(url.trim() && anonKey.trim());
  const config: SupabaseConfig = {
    url: url.trim(),
    anonKey: anonKey.trim(),
    isConnected,
  };

  try {
    if (isConnected) {
      localStorage.setItem(LOCAL_STORAGE_SUPABASE_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_SUPABASE_KEY);
    }
  } catch (e) {
    console.error('Erro ao salvar config do Supabase', e);
  }

  // Recria cliente singleton
  initSupabaseClient(config);
  return config;
}

let supabaseInstance: SupabaseClient<any, any, any> | null = null;

export function initSupabaseClient(config?: SupabaseConfig): SupabaseClient<any, any, any> | null {
  const currentConfig = config || getStoredSupabaseConfig();
  if (currentConfig.isConnected && currentConfig.url && currentConfig.anonKey) {
    try {
      supabaseInstance = createClient(currentConfig.url, currentConfig.anonKey, {
        db: {
          schema: 'oficina',
        },
      });
      return supabaseInstance;
    } catch (err) {
      console.error('Erro ao inicializar Supabase client', err);
      supabaseInstance = null;
      return null;
    }
  }
  supabaseInstance = null;
  return null;
}

export function getSupabase(): SupabaseClient<any, any, any> | null {
  if (!supabaseInstance) {
    supabaseInstance = initSupabaseClient();
  }
  return supabaseInstance;
}
