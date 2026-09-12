import { useEffect, useState } from 'react';
import { api } from './services/api';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  date: string;
}

export function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('INCOME');
  const [category, setCategory] = useState('');

  // 1. Busca as transações do banco de dados quando a página carrega
  useEffect(() => {
    api.get('/transactions').then((response) => {
      setTransactions(response.data);
    });
  }, []);

  // 2. LÓGICA DO SALDO TOTAL: Recalcula Entradas, Saídas e Saldo Total automaticamente
  const summary = transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === 'INCOME') {
        acc.income += transaction.amount;
        acc.total += transaction.amount;
      } else {
        acc.expense += transaction.amount;
        acc.total -= transaction.amount;
      }
      return acc;
    },
    { income: 0, expense: 0, total: 0 }
  );

  // Helper para formatar números como Moeda Brasileira (R$)
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // 3. Cadastra uma nova transação enviando os dados para a API
  async function handleCreateTransaction(e: React.FormEvent) {
    e.preventDefault();

    if (!description || !amount || !category) {
      alert('Preencha todos os campos!');
      return;
    }

    const response = await api.post('/transactions', {
      description,
      amount: Number(amount),
      type,
      category,
    });

    setTransactions([...transactions, response.data]);
    setDescription('');
    setAmount('');
    setCategory('');
  }

  // 4. Deleta uma transação
  async function handleDeleteTransaction(id: string) {
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(transactions.filter((transaction) => transaction.id !== id));
    } catch (error) {
      alert('Erro ao excluir a transação.');
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Gerenciador Financeiro</h1>

      {/* BLOCO DOS CARTÕES DE SALDO (ENTRADAS, SAÍDAS E SALDO TOTAL) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        
        {/* Cartão 1: Entradas */}
        <div style={{ background: '#e6fffa', padding: '1rem', borderRadius: '8px', border: '1px solid #b2f5ea' }}>
          <span style={{ fontSize: '0.9rem', color: '#234e52' }}>Receitas</span>
          <h2 style={{ color: '#276749', margin: '0.5rem 0 0 0' }}>{formatCurrency(summary.income)}</h2>
        </div>

        {/* Cartão 2: Saídas */}
        <div style={{ background: '#fff5f5', padding: '1rem', borderRadius: '8px', border: '1px solid #fed7d7' }}>
          <span style={{ fontSize: '0.9rem', color: '#742a2a' }}>Despesas</span>
          <h2 style={{ color: '#9b2c2c', margin: '0.5rem 0 0 0' }}>{formatCurrency(summary.expense)}</h2>
        </div>

        {/* Cartão 3: Saldo Total */}
        <div style={{ 
          background: summary.total >= 0 ? '#ebf8ff' : '#fff5f5', 
          padding: '1rem', 
          borderRadius: '8px', 
          border: `1px solid ${summary.total >= 0 ? '#bee3f8' : '#fed7d7'}` 
        }}>
          <span style={{ fontSize: '0.9rem', color: summary.total >= 0 ? '#2c5282' : '#742a2a' }}>
            Saldo Total
          </span>
          <h2 style={{ color: summary.total >= 0 ? '#2b6cb0' : '#9b2c2c', margin: '0.5rem 0 0 0' }}>
            {formatCurrency(summary.total)}
          </h2>
        </div>

      </div>

      {/* --- FORMULÁRIO DE CADASTRO --- */}
      <form onSubmit={handleCreateTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
        <h3>Nova Transação</h3>
        <input 
          placeholder="Descrição" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          style={{ padding: '0.5rem' }}
        />
        <input 
          type="number" 
          placeholder="Valor (R$)" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          style={{ padding: '0.5rem' }}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '0.5rem' }}> 
          <option value="">Selecione uma categoria</option>
          <option value="GROCERIES">Mercado </option>
          <option value="DRUGSTORE">Farmácia </option>
          <option value="HOUSEBILLS">Gastos com moradia </option>
          <option value="EXTRA">Gastos extraordinários </option>
          <option value="SHOPPING">Compras desnecessárias </option>
        </select>

        <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: '0.5rem' }}>
          <option value="INCOME">Receita (+)</option>
          <option value="EXPENSE">Despesa (-)</option>
        </select>

        <button type="submit" style={{ padding: '0.75rem', background: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Adicionar Transação
        </button>
      </form>

      {/* LISTA DE TRANSAÇÕES */}
      <h3>Histórico</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {transactions.map((t) => (
          <li key={t.id} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '0.75rem', 
            marginBottom: '0.5rem', 
            background: '#f7fafc', 
            borderRadius: '4px',
            borderLeft: `4px solid ${t.type === 'INCOME' ? '#38a169' : '#e53e3e'}`
          }}>
            <div>
              <strong>{t.description}</strong>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>{t.category}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontWeight: 'bold', color: t.type === 'INCOME' ? '#38a169' : '#e53e3e' }}>
                {t.type === 'INCOME' ? '+ ' : '- '}{formatCurrency(t.amount)}
              </span>
              <button 
                onClick={() => handleDeleteTransaction(t.id)}
                style={{ 
                  background: '#e53e3e', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '4px', 
                  padding: '0.25rem 0.5rem', 
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;