-- ==============================================================================
-- SCHEMA DDL: SISTEMA DE GESTÃO DE OFICINA MECÂNICA (AUTODEV / VITALAUTO PRO)
-- Compatível com Supabase / PostgreSQL
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Criar tipo ENUM para status da Ordem de Serviço
DO $$ BEGIN
    CREATE TYPE status_os_enum AS ENUM (
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

-- 3. Tabela: CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    cpf_cnpj VARCHAR(20),
    endereco TEXT,
    cidade VARCHAR(100),
    criado_em TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Tabela: VEICULOS (Relacionamento N:1 com clientes)
CREATE TABLE IF NOT EXISTS public.veiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    placa VARCHAR(10) NOT NULL UNIQUE,
    modelo VARCHAR(100) NOT NULL,
    marca VARCHAR(100) NOT NULL,
    ano INTEGER NOT NULL,
    cor VARCHAR(50),
    km_atual INTEGER NOT NULL DEFAULT 0,
    combustivel VARCHAR(30),
    chassi VARCHAR(50),
    criado_em TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Tabela: PRODUTOS / ESTOQUE DE PEÇAS
CREATE TABLE IF NOT EXISTS public.produtos_pecas (
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

-- 6. Tabela: SERVIÇOS DE MÃO DE OBRA
CREATE TABLE IF NOT EXISTS public.servicos_mao_de_obra (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome_servico VARCHAR(255) NOT NULL,
    preco_base NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tempo_estimado_min INTEGER DEFAULT 60,
    categoria VARCHAR(100) DEFAULT 'Mecânica Geral',
    criado_em TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Tabela: ORDENS DE SERVIÇO (OS)
CREATE SEQUENCE IF NOT EXISTS os_numero_seq START WITH 1001;

CREATE TABLE IF NOT EXISTS public.ordens_servico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_os INTEGER DEFAULT nextval('os_numero_seq') UNIQUE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    veiculo_id UUID NOT NULL REFERENCES public.veiculos(id) ON DELETE RESTRICT,
    status status_os_enum NOT NULL DEFAULT 'orcamento',
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

-- 8. Tabela: ITENS DA OS - PEÇAS (N:N com estoque)
CREATE TABLE IF NOT EXISTS public.itens_os_pecas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    produto_id UUID NOT NULL REFERENCES public.produtos_pecas(id) ON DELETE RESTRICT,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario NUMERIC(10, 2) NOT NULL CHECK (preco_unitario >= 0),
    subtotal NUMERIC(10, 2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED
);

-- 9. Tabela: ITENS DA OS - SERVIÇOS (N:N com mão de obra)
CREATE TABLE IF NOT EXISTS public.itens_os_servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    servico_id UUID NOT NULL REFERENCES public.servicos_mao_de_obra(id) ON DELETE RESTRICT,
    quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    preco_unitario NUMERIC(10, 2) NOT NULL CHECK (preco_unitario >= 0),
    subtotal NUMERIC(10, 2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED
);

-- ==============================================================================
-- ÍNDICES PARA ALTA PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON public.veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_veiculos_cliente ON public.veiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_os_cliente ON public.ordens_servico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_os_veiculo ON public.ordens_servico(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_os_status ON public.ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_os_criado_em ON public.ordens_servico(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_itens_pecas_os ON public.itens_os_pecas(os_id);
CREATE INDEX IF NOT EXISTS idx_itens_servicos_os ON public.itens_os_servicos(os_id);

-- ==============================================================================
-- TRIGGER PARA ATUALIZAR QUILOMETRAGEM DO VEÍCULO QUANDO CRIAR/EDITAR OS
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_veiculo_km()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.km_entrada > 0 THEN
        UPDATE public.veiculos
        SET km_atual = GREATEST(km_atual, NEW.km_entrada)
        WHERE id = NEW.veiculo_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_veiculo_km ON public.ordens_servico;
CREATE TRIGGER trg_update_veiculo_km
AFTER INSERT OR UPDATE OF km_entrada ON public.ordens_servico
FOR EACH ROW EXECUTE FUNCTION update_veiculo_km();

-- ==============================================================================
-- POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- Permite leitura e gravação autenticada ou chave anônima para a aplicação
-- ==============================================================================
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_mao_de_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_os_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_os_servicos ENABLE ROW LEVEL SECURITY;

-- Políticas para acesso público/anon (ou customize para auth.uid())
CREATE POLICY "Permitir acesso completo a clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo a veiculos" ON public.veiculos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo a produtos_pecas" ON public.produtos_pecas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo a servicos_mao_de_obra" ON public.servicos_mao_de_obra FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo a ordens_servico" ON public.ordens_servico FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo a itens_os_pecas" ON public.itens_os_pecas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso completo a itens_os_servicos" ON public.itens_os_servicos FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- DADOS INICIAIS (SEED DATA) PARA TESTE IMEDIATO
-- ==============================================================================
INSERT INTO public.clientes (id, nome, telefone, email, cpf_cnpj, endereco, cidade) VALUES
('a1111111-1111-1111-1111-111111111111', 'Carlos Eduardo Silva', '(11) 98765-4321', 'carlos.silva@email.com', '123.456.789-00', 'Av. Paulista, 1000', 'São Paulo - SP'),
('a2222222-2222-2222-2222-222222222222', 'Mariana Alencar Souza', '(11) 99123-8877', 'mariana.alencar@gmail.com', '234.567.890-11', 'Rua das Flores, 240', 'São Paulo - SP'),
('a3333333-3333-3333-3333-333333333333', 'Transportes & Logística Veloz Ltda', '(11) 3456-7890', 'contato@velozlog.com.br', '12.345.678/0001-90', 'Av. das Nações Unidas, 4500', 'São Paulo - SP')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.veiculos (id, cliente_id, placa, modelo, marca, ano, cor, km_atual, combustivel) VALUES
('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'BRA2E19', 'Corolla XEi 2.0', 'Toyota', 2021, 'Prata', 48500, 'Flex'),
('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'RTO8F23', 'Renegade Longitude 1.3 Turbo', 'Jeep', 2022, 'Branco', 32400, 'Flex'),
('b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'FGH9012', 'Hilux CD SRV 2.8 4x4 Diesel', 'Toyota', 2020, 'Preto', 94200, 'Diesel'),
('b4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 'ABC1234', 'HB20 Evolution 1.0', 'Hyundai', 2019, 'Cinza', 67000, 'Flex')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.produtos_pecas (id, codigo, nome_peca, marca, preco_venda, preco_custo, quantidade_estoque, estoque_minimo, unidade, categoria) VALUES
('c1111111-1111-1111-1111-111111111111', 'PEC-001', 'Óleo Sintético 5W30 (1L)', 'Motul / Castrol', 48.00, 26.50, 45, 10, 'L', 'Lubrificantes'),
('c2222222-2222-2222-2222-222222222222', 'PEC-002', 'Filtro de Óleo Blindado', 'Fram / Mann', 35.00, 16.00, 18, 5, 'UN', 'Filtros'),
('c3333333-3333-3333-3333-333333333333', 'PEC-003', 'Filtro de Ar do Motor', 'Tecfil', 42.00, 20.00, 12, 4, 'UN', 'Filtros'),
('c4444444-4444-4444-4444-444444444444', 'PEC-004', 'Jogo de Pastilhas de Freio Dianteiro', 'Cobreq / Fras-le', 165.00, 89.00, 8, 3, 'JG', 'Freios'),
('c5555555-5555-5555-5555-555555555555', 'PEC-005', 'Fluido de Freio DOT 4 (500ml)', 'Bosch', 38.00, 18.00, 14, 5, 'UN', 'Fluidos'),
('c6666666-6666-6666-6666-666666666666', 'PEC-006', 'Par de Amortecedores Dianteiros', 'Cofap / Monroe', 580.00, 360.00, 4, 2, 'PAR', 'Suspensão'),
('c7777777-7777-7777-7777-777777777777', 'PEC-007', 'Correia Dentada + Tensor', 'Gates / Continental', 240.00, 130.00, 6, 2, 'KIT', 'Motor')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.servicos_mao_de_obra (id, codigo, nome_servico, preco_base, tempo_estimado_min, categoria) VALUES
('d1111111-1111-1111-1111-111111111111', 'SRV-001', 'Troca de Óleo e Filtros', 60.00, 30, 'Revisão Rápida'),
('d2222222-2222-2222-2222-222222222222', 'SRV-002', 'Alinhamento 3D e Balanceamento (4 Rodas)', 120.00, 45, 'Geometria'),
('d3333333-3333-3333-3333-333333333333', 'SRV-003', 'Substituição de Pastilhas de Freio', 90.00, 40, 'Freios'),
('d4444444-4444-4444-4444-444444444444', 'SRV-004', 'Higienização de Ar-Condicionado + Filtro Cabine', 110.00, 40, 'Climatização'),
('d5555555-5555-5555-5555-555555555555', 'SRV-005', 'Revisão Preventiva Completa (Checkup 50 itens)', 280.00, 120, 'Revisão'),
('d6666666-6666-6666-6666-666666666666', 'SRV-006', 'Substituição de Amortecedores Dianteiros', 220.00, 90, 'Suspensão')
ON CONFLICT (id) DO NOTHING;
