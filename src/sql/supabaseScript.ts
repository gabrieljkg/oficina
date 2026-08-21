export const SUPABASE_SQL_DDL = `-- ==============================================================================
-- SCHEMA DDL: SISTEMA DE GESTÃO DE OFICINA MECÂNICA (AUTODEV / VITALAUTO PRO)
-- Schema: oficina
-- Compatível com Supabase / PostgreSQL
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Criar o Schema oficina
CREATE SCHEMA IF NOT EXISTS oficina;

-- Conceder permissões no schema para as roles do Supabase
GRANT USAGE ON SCHEMA oficina TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA oficina GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA oficina GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA oficina GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- 3. Criar tipo ENUM para status da Ordem de Serviço no schema oficina
DO $$ BEGIN
    CREATE TYPE oficina.status_os_enum AS ENUM (
        'orcamento',
        'aprovado',
        'em_execucao',
        'concluido',
        'pago',
        'cancelado'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Tabela: CLIENTES
CREATE TABLE IF NOT EXISTS oficina.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    cpf_cnpj VARCHAR(20),
    endereco TEXT,
    cidade VARCHAR(100),
    criado_em TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Tabela: VEICULOS (Relacionamento N:1 com clientes)
CREATE TABLE IF NOT EXISTS oficina.veiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES oficina.clientes(id) ON DELETE CASCADE,
    placa VARCHAR(10) NOT NULL UNIQUE,
    modelo VARCHAR(100) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    ano INTEGER NOT NULL,
    cor VARCHAR(50),
    km_atual INTEGER NOT NULL DEFAULT 0,
    combustivel VARCHAR(30) DEFAULT 'Flex',
    chassi VARCHAR(50),
    criado_em TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Tabela: PRODUTOS / ESTOQUE DE PEÇAS
CREATE TABLE IF NOT EXISTS oficina.produtos_pecas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome_peca VARCHAR(255) NOT NULL,
    marca VARCHAR(100),
    preco_venda NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    preco_custo NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    quantidade_estoque INTEGER NOT NULL DEFAULT 0,
    estoque_minimo INTEGER NOT NULL DEFAULT 2,
    unidade VARCHAR(10) DEFAULT 'UN',
    categoria VARCHAR(100) DEFAULT 'Geral',
    criado_em TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Tabela: SERVIÇOS DE MÃO DE OBRA
CREATE TABLE IF NOT EXISTS oficina.servicos_mao_de_obra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome_servico VARCHAR(255) NOT NULL,
    preco_base NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tempo_estimado_min INTEGER DEFAULT 60,
    categoria VARCHAR(100) DEFAULT 'Mecânica Geral',
    criado_em TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Tabela: ORDENS DE SERVIÇO (OS)
CREATE SEQUENCE IF NOT EXISTS oficina.os_numero_seq START WITH 1001;

CREATE TABLE IF NOT EXISTS oficina.ordens_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_os INTEGER DEFAULT nextval('oficina.os_numero_seq') UNIQUE,
    cliente_id UUID NOT NULL REFERENCES oficina.clientes(id) ON DELETE RESTRICT,
    veiculo_id UUID NOT NULL REFERENCES oficina.veiculos(id) ON DELETE RESTRICT,
    status oficina.status_os_enum NOT NULL DEFAULT 'orcamento',
    valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    valor_pecas NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    valor_servicos NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    desconto NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    observacoes TEXT,
    km_entrada INTEGER NOT NULL DEFAULT 0,
    mecanico_responsavel VARCHAR(150),
    previsao_entrega DATE,
    concluido_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Tabela: ITENS DA OS - PEÇAS
CREATE TABLE IF NOT EXISTS oficina.itens_os_pecas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID NOT NULL REFERENCES oficina.ordens_servico(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES oficina.produtos_pecas(id) ON DELETE RESTRICT,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario NUMERIC(10, 2) NOT NULL CHECK (preco_unitario >= 0),
    subtotal NUMERIC(10, 2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED
);

-- 10. Tabela: ITENS DA OS - SERVIÇOS
CREATE TABLE IF NOT EXISTS oficina.itens_os_servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID NOT NULL REFERENCES oficina.ordens_servico(id) ON DELETE CASCADE,
    servico_id UUID NOT NULL REFERENCES oficina.servicos_mao_de_obra(id) ON DELETE RESTRICT,
    quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    preco_unitario NUMERIC(10, 2) NOT NULL CHECK (preco_unitario >= 0),
    subtotal NUMERIC(10, 2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED
);

-- ==============================================================================
-- ÍNDICES DE PERFORMANCE NO SCHEMA oficina
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON oficina.veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_veiculos_cliente ON oficina.veiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_os_cliente ON oficina.ordens_servico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_os_veiculo ON oficina.ordens_servico(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_os_status ON oficina.ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_os_criado_em ON oficina.ordens_servico(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_itens_pecas_os ON oficina.itens_os_pecas(os_id);
CREATE INDEX IF NOT EXISTS idx_itens_servicos_os ON oficina.itens_os_servicos(os_id);

-- ==============================================================================
-- TRIGGER PARA ATUALIZAR QUILOMETRAGEM DO VEÍCULO AUTOMATICAMENTE
-- ==============================================================================
CREATE OR REPLACE FUNCTION oficina.update_veiculo_km()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.km_entrada > 0 THEN
        UPDATE oficina.veiculos
        SET km_atual = GREATEST(km_atual, NEW.km_entrada)
        WHERE id = NEW.veiculo_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_veiculo_km ON oficina.ordens_servico;
CREATE TRIGGER trg_update_veiculo_km
AFTER INSERT OR UPDATE OF km_entrada ON oficina.ordens_servico
FOR EACH ROW EXECUTE FUNCTION oficina.update_veiculo_km();

-- ==============================================================================
-- PERMISSÕES E ROW LEVEL SECURITY (RLS) NO SCHEMA oficina
-- ==============================================================================
GRANT ALL ON ALL TABLES IN SCHEMA oficina TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA oficina TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA oficina TO anon, authenticated, service_role;

ALTER TABLE oficina.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE oficina.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE oficina.produtos_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE oficina.servicos_mao_de_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE oficina.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE oficina.itens_os_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE oficina.itens_os_servicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso completo a clientes" ON oficina.clientes;
CREATE POLICY "Permitir acesso completo a clientes" ON oficina.clientes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a veiculos" ON oficina.veiculos;
CREATE POLICY "Permitir acesso completo a veiculos" ON oficina.veiculos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a produtos_pecas" ON oficina.produtos_pecas;
CREATE POLICY "Permitir acesso completo a produtos_pecas" ON oficina.produtos_pecas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a servicos_mao_de_obra" ON oficina.servicos_mao_de_obra;
CREATE POLICY "Permitir acesso completo a servicos_mao_de_obra" ON oficina.servicos_mao_de_obra FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a ordens_servico" ON oficina.ordens_servico;
CREATE POLICY "Permitir acesso completo a ordens_servico" ON oficina.ordens_servico FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a itens_os_pecas" ON oficina.itens_os_pecas;
CREATE POLICY "Permitir acesso completo a itens_os_pecas" ON oficina.itens_os_pecas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso completo a itens_os_servicos" ON oficina.itens_os_servicos;
CREATE POLICY "Permitir acesso completo a itens_os_servicos" ON oficina.itens_os_servicos FOR ALL USING (true) WITH CHECK (true);
`;
