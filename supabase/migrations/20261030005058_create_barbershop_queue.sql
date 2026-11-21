/*
# Create barbershop queue (fila por ordem de chegada)

Plain-English summary
This migration creates the tables and rules for a digital queue that replaces the paper notebook.
Clients join a barber's queue by name only (no time slot). Each client gets a position
(1, 2, 3...) and the queue is shared by every device through the database.

1. New Tables
- `barbeiros`: the three barbers (id, nome). Seeded with "Barbeiro 1", "Barbeiro 2", "Barbeiro 3".
- `fila`: one row per client in a queue.
  - `id` (uuid, primary key)
  - `nome_cliente` (text, 2 to 60 characters)
  - `barbeiro_id` (which barber)
  - `posicao` (position in the queue, recalculated automatically)
  - `criado_em` (arrival timestamp, used for ordering)
  - `dia` (date in Sao Paulo time; the queue resets daily because only today's rows are shown)
  - `status` (aguardando | concluido)

2. Functions (the only way to change the queue)
- `entrar_na_fila(p_nome, p_barbeiro_id)`: validates the name, locks the barber, assigns the next position and inserts the client.
- `concluir_cliente(p_id)`: marks a client as concluido and renumbers the remaining waiting clients so positions stay 1, 2, 3...

3. Security
- RLS enabled on `barbeiros` and `fila`.
- Anyone (anon and signed-in users) can SELECT both tables, because the queue is public.
- No direct INSERT, UPDATE or DELETE on the tables; changes go through the functions above.
- EXECUTE on the two functions is granted to anon and authenticated only.

4. Realtime
- `fila` is added to the realtime publication so public screens update live.

Important notes
1. Daily reset: no rows are deleted. The app only displays rows whose `dia` is today.
2. Old rows are kept as history.
3. The barber login is handled in the app, so these functions are callable by anyone with the anon key (MVP trade-off).
*/

CREATE TABLE IF NOT EXISTS barbeiros (
  id smallint PRIMARY KEY,
  nome text NOT NULL
);

INSERT INTO barbeiros (id, nome) VALUES
  (1, 'Barbeiro 1'),
  (2, 'Barbeiro 2'),
  (3, 'Barbeiro 3')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS fila (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente text NOT NULL CHECK (char_length(nome_cliente) BETWEEN 2 AND 60),
  barbeiro_id smallint NOT NULL REFERENCES barbeiros(id),
  posicao integer NOT NULL CHECK (posicao > 0),
  criado_em timestamptz NOT NULL DEFAULT now(),
  dia date NOT NULL DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo')::date),
  status text NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'concluido'))
);

CREATE INDEX IF NOT EXISTS fila_barbeiro_dia_status_idx
  ON fila (barbeiro_id, dia, status, criado_em);

ALTER TABLE barbeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE fila ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON barbeiros, fila TO anon, authenticated;

DROP POLICY IF EXISTS "public_select_barbeiros" ON barbeiros;
CREATE POLICY "public_select_barbeiros" ON barbeiros FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_select_fila" ON fila;
CREATE POLICY "public_select_fila" ON fila FOR SELECT
  TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION entrar_na_fila(p_nome text, p_barbeiro_id smallint)
RETURNS fila
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome text := btrim(p_nome);
  v_hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_posicao integer;
  v_row fila;
BEGIN
  IF char_length(v_nome) < 2 OR char_length(v_nome) > 60 THEN
    RAISE EXCEPTION 'Nome inválido' USING ERRCODE = '22023';
  END IF;

  PERFORM 1 FROM barbeiros WHERE id = p_barbeiro_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Barbeiro não encontrado' USING ERRCODE = '22023';
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

CREATE OR REPLACE FUNCTION concluir_cliente(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_barbeiro smallint;
  v_dia date;
BEGIN
  SELECT barbeiro_id, dia INTO v_barbeiro, v_dia
  FROM fila
  WHERE id = p_id AND status = 'aguardando';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cliente não está aguardando' USING ERRCODE = 'P0002';
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

REVOKE EXECUTE ON FUNCTION entrar_na_fila(text, smallint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION concluir_cliente(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION entrar_na_fila(text, smallint) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION concluir_cliente(uuid) TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'fila'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE fila;
  END IF;
END $$;
