/*
# Acesso individual dos barbeiros + abrir/fechar fila

Resumo
- Cada barbeiro passa a ter usuário e senha próprios (guardados com hash no banco, nunca no site).
- Cada barbeiro só consegue mexer na PRÓPRIA fila (concluir clientes, abrir e fechar).
- Cada fila tem um estado "aberta/fechada". Clientes só conseguem entrar numa fila aberta.
- A fila aberta vale só para o dia de hoje (fuso de São Paulo): à meia-noite todas voltam a ficar
  fechadas, então no dia seguinte o barbeiro precisa abrir de novo.

Usuários e senhas iniciais (TROQUE depois, veja o final deste arquivo):
- barbeiro1 / barbeiro1
- barbeiro2 / barbeiro2
- barbeiro3 / barbeiro3

Como trocar uma senha (rode no SQL Editor do Supabase):
  UPDATE barbeiros_acesso
     SET senha_hash = extensions.crypt('NOVA_SENHA', extensions.gen_salt('bf'))
   WHERE usuario = 'barbeiro1';

Como trocar o nome que aparece para os clientes:
  UPDATE barbeiros SET nome = 'João' WHERE id = 1;
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1) Estado da fila (data em que ela foi aberta; vazio = fechada)
ALTER TABLE barbeiros ADD COLUMN IF NOT EXISTS aberta_dia date;

-- 2) Logins (tabela privada: ninguém de fora consegue ler)
CREATE TABLE IF NOT EXISTS barbeiros_acesso (
  barbeiro_id smallint PRIMARY KEY REFERENCES barbeiros(id) ON DELETE CASCADE,
  usuario text NOT NULL UNIQUE,
  senha_hash text NOT NULL
);

ALTER TABLE barbeiros_acesso ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON barbeiros_acesso FROM anon, authenticated;

INSERT INTO barbeiros_acesso (barbeiro_id, usuario, senha_hash)
SELECT id, 'barbeiro' || id::text, extensions.crypt('barbeiro' || id::text, extensions.gen_salt('bf'))
FROM barbeiros
ON CONFLICT (barbeiro_id) DO NOTHING;

-- 3) Sessões de login (também privadas)
CREATE TABLE IF NOT EXISTS sessoes_barbeiro (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barbeiro_id smallint NOT NULL REFERENCES barbeiros(id) ON DELETE CASCADE,
  expira_em timestamptz NOT NULL DEFAULT (now() + interval '12 hours')
);

ALTER TABLE sessoes_barbeiro ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON sessoes_barbeiro FROM anon, authenticated;

-- 4) Login: confere usuário e senha e devolve um token temporário
CREATE OR REPLACE FUNCTION login_barbeiro(p_usuario text, p_senha text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_id smallint;
  v_token uuid;
BEGIN
  SELECT a.barbeiro_id INTO v_id
  FROM barbeiros_acesso a
  WHERE a.usuario = lower(btrim(p_usuario))
    AND a.senha_hash = crypt(coalesce(p_senha, ''), a.senha_hash);

  IF v_id IS NULL THEN
    PERFORM pg_sleep(0.5);
    RAISE EXCEPTION 'Usuário ou senha incorretos' USING ERRCODE = '28P01';
  END IF;

  DELETE FROM sessoes_barbeiro WHERE expira_em < now();

  INSERT INTO sessoes_barbeiro (barbeiro_id) VALUES (v_id) RETURNING token INTO v_token;

  RETURN jsonb_build_object('token', v_token, 'barbeiro_id', v_id);
END;
$$;

-- 5) Uso interno: descobre qual barbeiro é dono do token
CREATE OR REPLACE FUNCTION barbeiro_da_sessao(p_token uuid)
RETURNS smallint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id smallint;
BEGIN
  SELECT s.barbeiro_id INTO v_id
  FROM sessoes_barbeiro s
  WHERE s.token = p_token AND s.expira_em > now();

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Sessão inválida ou expirada' USING ERRCODE = '28000';
  END IF;

  RETURN v_id;
END;
$$;

-- 6) Abrir / fechar a própria fila
CREATE OR REPLACE FUNCTION definir_fila_aberta(p_token uuid, p_aberta boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id smallint := barbeiro_da_sessao(p_token);
  v_hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
BEGIN
  UPDATE barbeiros
  SET aberta_dia = CASE WHEN p_aberta THEN v_hoje ELSE NULL END
  WHERE id = v_id;
END;
$$;

-- 7) Concluir cliente: agora exige login e só vale para a própria fila
DROP FUNCTION IF EXISTS concluir_cliente(uuid);

CREATE OR REPLACE FUNCTION concluir_cliente(p_id uuid, p_token uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sessao smallint := barbeiro_da_sessao(p_token);
  v_barbeiro smallint;
  v_dia date;
BEGIN
  SELECT barbeiro_id, dia INTO v_barbeiro, v_dia
  FROM fila
  WHERE id = p_id AND status = 'aguardando';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cliente não está aguardando' USING ERRCODE = 'P0002';
  END IF;

  IF v_barbeiro <> v_sessao THEN
    RAISE EXCEPTION 'Sem permissão para esta fila' USING ERRCODE = '42501';
  END IF;

  PERFORM 1 FROM barbeiros WHERE id = v_barbeiro FOR UPDATE;

  UPDATE fila SET status = 'concluido' WHERE id = p_id;

  UPDATE fila f
  SET posicao = r.nova_posicao
  FROM (
    SELECT id, row_number() OVER (ORDER BY criado_em, id) AS nova_posicao
    FROM fila
    WHERE barbeiro_id = v_barbeiro AND dia = v_dia AND status = 'aguardando'
  ) r
  WHERE f.id = r.id;
END;
$$;

-- 8) Entrar na fila: só se a fila do barbeiro estiver aberta hoje
CREATE OR REPLACE FUNCTION entrar_na_fila(p_nome text, p_barbeiro_id smallint)
RETURNS fila
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome text := btrim(p_nome);
  v_hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_aberta date;
  v_posicao integer;
  v_row fila;
BEGIN
  IF char_length(v_nome) < 2 OR char_length(v_nome) > 60 THEN
    RAISE EXCEPTION 'Nome inválido' USING ERRCODE = '22023';
  END IF;

  SELECT aberta_dia INTO v_aberta FROM barbeiros WHERE id = p_barbeiro_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Barbeiro não encontrado' USING ERRCODE = '22023';
  END IF;

  IF v_aberta IS DISTINCT FROM v_hoje THEN
    RAISE EXCEPTION 'Fila fechada' USING ERRCODE = '55000';
  END IF;

  SELECT count(*) + 1 INTO v_posicao
  FROM fila
  WHERE barbeiro_id = p_barbeiro_id AND dia = v_hoje AND status = 'aguardando';

  INSERT INTO fila (nome_cliente, barbeiro_id, posicao, dia)
  VALUES (v_nome, p_barbeiro_id, v_posicao, v_hoje)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

-- 9) Permissões
REVOKE EXECUTE ON FUNCTION barbeiro_da_sessao(uuid) FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION login_barbeiro(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION definir_fila_aberta(uuid, boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION concluir_cliente(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION login_barbeiro(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION definir_fila_aberta(uuid, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION concluir_cliente(uuid, uuid) TO anon, authenticated;

-- 10) Tempo real também para abrir/fechar fila
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'barbeiros'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE barbeiros;
  END IF;
END $$;
