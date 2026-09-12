import express, { Request, Response } from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
app.use(cors());
app.use(express.json());

// 1. Inicializa o banco de dados SQLite local
const db = new Database('dev.db');

// 2. Criação das tabelas
db.exec('CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL);');
db.exec('CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, description TEXT NOT NULL, amount REAL NOT NULL, type TEXT NOT NULL, category TEXT NOT NULL, date TEXT NOT NULL);');

// Rota de Teste
app.get('/api/health', (req: Request, res: Response) => {
  return res.json({ status: 'OK', message: 'Servidor e Banco de Dados rodando!' });
});

// Rota 1: Listar todas as transações
app.get('/api/transactions', (req: Request, res: Response) => {
  try {
    const transactions = db.prepare('SELECT * FROM transactions').all();
    return res.json(transactions);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar transações.' });
  }
});

// Rota 2: Criar uma nova transação
app.post('/api/transactions', (req: Request, res: Response) => {
  const { description, amount, type, category } = req.body;
  const id = Date.now().toString();
  const date = new Date().toISOString();

  try {
    const stmt = db.prepare('INSERT INTO transactions (id, description, amount, type, category, date) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, description, Number(amount), type, category, date);

    return res.status(201).json({ id, description, amount, type, category, date });
  } catch (error) {
    return res.status(400).json({ error: 'Erro ao cadastrar transação.' });
  }
});

const PORT2 = 3000;
app.listen(PORT2, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor e banco de dados rodando em http://localhost:${PORT}`);
});