import express, { Request, Response } from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

const app = express();
app.use(express.json());
app.use(cors());

// Conexão com o banco SQLite
const db = new Database('dev.db');

// Garantir a criação da tabela no banco de dados
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL
  );
`);

// Rota de Health Check
app.get('/api/health', (req: Request, res: Response) => {
  return res.json({ status: 'OK', message: 'Servidor e Banco de Dados rodando!' });
});

// 1. ROTA GET: Listar todas as transações
app.get('/api/transactions', (req: Request, res: Response) => {
  try {
    const transactions = db.prepare('SELECT * FROM transactions').all();
    return res.json(transactions);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar transações.' });
  }
});

// 2. ROTA POST: Criar uma nova transação
app.post('/api/transactions', (req: Request, res: Response) => {
  const { description, amount, type, category } = req.body;

  if (!description || !amount || !type || !category) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  const newTransaction = {
    id: randomUUID(),
    description,
    amount,
    type,
    category,
    date: new Date().toISOString(),
  };

  try {
    const stmt = db.prepare(`
      INSERT INTO transactions (id, description, amount, type, category, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      newTransaction.id,
      newTransaction.description,
      newTransaction.amount,
      newTransaction.type,
      newTransaction.category,
      newTransaction.date
    );

    return res.status(201).json(newTransaction);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao criar transação.' });
  }
});

// 3. ROTA PUT: Editar uma transação existente pelo ID
app.put('/api/transactions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { description, amount, type, category } = req.body;

  if (!description || !amount || !type || !category) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    const stmt = db.prepare(`
      UPDATE transactions 
      SET description = ?, amount = ?, type = ?, category = ?
      WHERE id = ?
    `);

    const result = stmt.run(description, amount, type, category, id);

if (result.changes === 0) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }

    return res.json({ id, description, amount, type, category });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao atualizar transação.' });
  }
});

// 4. ROTA DELETE: Deletar uma transação pelo ID
app.delete('/api/transactions/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const stmt = db.prepare('DELETE FROM transactions WHERE id = ?');
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transação não encontrada.' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao deletar transação.' });
  }
});

// Inicia o servidor
app.listen(3000, () => {
  console.log('🚀 Servidor rodando na porta 3000!');
});