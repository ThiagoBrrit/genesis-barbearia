# Fila da Barbearia

Site de fila por ordem de chegada para barbearia. Clientes entram na fila com nome e barbeiro, sem horário fixo. Os barbeiros veem e concluem a fila no celular.

## Rodar localmente

1. Instale as dependências: `npm install`
2. Inicie o site: `npm run dev`
3. Abra o endereço que aparecer no terminal.

## Telas

- `/` Início, com os 3 barbeiros e a demanda de cada um
- `/marcar` Marcar Horário (nome + barbeiro)
- `/marcar/confirmado` Confirmação com a posição na fila
- `/filas` Filas ao vivo de todos os barbeiros
- `/admin` Login do barbeiro
- `/admin/painel` Fila do barbeiro logado (arraste para a esquerda ou toque no check para concluir)

## Trocar nomes, cores e credenciais

- **Nome da barbearia e login do barbeiro:** arquivo `src/config.ts`. Procure por `TROCAR`.
- **Nomes dos barbeiros:** tabela `barbeiros` no Supabase (painel do Supabase > Table Editor). Basta editar a coluna `nome`.
- **Cores:** arquivo `tailwind.config.js` (`gold` = dourado, `ink` = preto). Textos e fundos usam essas cores.
- **Tempo de atualização automática das filas:** `POLLING_INTERVAL_MS` em `src/config.ts`.

## Reset diário

A fila mostra apenas os clientes do dia (fuso de São Paulo). No dia seguinte a fila começa vazia automaticamente, sem apagar o histórico. A lógica está em `dataDeHoje` em `src/lib/queue.ts`.

## Publicar na Vercel

1. Suba o projeto para um repositório no GitHub.
2. Na Vercel, importe o repositório. Ele usa Vite automaticamente.
3. Adicione as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas configurações do projeto.
4. Clique em Deploy. O arquivo `vercel.json` garante que `/admin` e `/filas` abram direto.

## Banco de dados

As tabelas, funções e regras estão na migração `create_barbershop_queue` aplicada no Supabase: tabela `barbeiros`, tabela `fila` e as funções `entrar_na_fila` e `concluir_cliente`.
