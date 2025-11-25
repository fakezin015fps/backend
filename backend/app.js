require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Pool de conexão para Render PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,   // Render usa esse padrão
  ssl: { rejectUnauthorized: false }            // IMPORTANTE para conexões externas
});

// Rota raiz só para testar se a API está no ar
app.get("/", (req, res) => {
  res.send("API está rodando no Render! 🚀");
});

// Listar tarefas
app.get('/tarefas', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM tarefas ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
});

// Criar tarefa
app.post('/tarefas', async (req, res) => {
  try {
    const { texto } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO tarefas (texto) VALUES ($1) RETURNING *",
      [texto]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
});

// Atualizar tarefa
app.put('/tarefas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { texto, concluida } = req.body;
    const { rows } = await pool.query(
      "UPDATE tarefas SET texto = COALESCE($1, texto), concluida = COALESCE($2, concluida) WHERE id = $3 RETURNING *",
      [texto, concluida, id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
});

// Remover tarefa
app.delete('/tarefas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM tarefas WHERE id = $1", [id]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover tarefa' });
  }
});

// O Render fornece automaticamente process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
