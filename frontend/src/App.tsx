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

// Opções predefinidas de categorias por tipo
const INCOME_CATEGORIES = ['Salário', 'Renda Extra', 'Prêmio'];
const EXPENSE_CATEGORIES = ['Mercado', 'Farmácia', 'Contas recorrentes', 'Shopping', 'Gastos extras'];

// Função auxiliar para obter a data atual no formato YYYY-MM-DD
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

export function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Estados para criação (formulário principal)
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('INCOME');
  const [category, setCategory] = useState(INCOME_CATEGORIES[0]);
  const [date, setDate] = useState(getTodayDateString());

  // Estado para Modal de Exclusão
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  // Estados para Modal de Edição
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');

  // 1. Carrega as transações do banco
  useEffect(() => {
    api.get('/transactions').then((response) => {
      setTransactions(response.data);
    });
  }, []);

  // Manipula mudança de tipo no formulário principal
  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === 'INCOME') {
      setCategory(INCOME_CATEGORIES[0]);
    } else {
      setCategory(EXPENSE_CATEGORIES[0]);
    }
  };

  // Manipula mudança de tipo no modal de edição
  const handleEditTypeChange = (newType: string) => {
    setEditType(newType);
    if (newType === 'INCOME') {
      setEditCategory(INCOME_CATEGORIES[0]);
    } else {
      setEditCategory(EXPENSE_CATEGORIES[0]);
    }
  };

  // 2. Cálculo dos totais
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(d);
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  // 3. Cadastrar nova transação (com a variável `date`)
  async function handleCreateTransaction(e: React.FormEvent) {
    e.preventDefault();

    if (!description || !amount || !category || !date) {
      alert('Preencha todos os campos!');
      return;
    }

    const response = await api.post('/transactions', {
      description,
      amount: Number(amount),
      type,
      category,
      date,
    });

    setTransactions([...transactions, response.data]);
    setDescription('');
    setAmount('');
    setType('INCOME');
    setCategory(INCOME_CATEGORIES[0]);
    setDate(getTodayDateString());
  }

  // 4. Abrir Modal de Edição com os valores atuais
  function handleOpenEditModal(transaction: Transaction) {
    setEditingTransaction(transaction);
    setEditDescription(transaction.description);
    setEditAmount(String(transaction.amount));
    setEditType(transaction.type);
    setEditCategory(transaction.category);
    setEditDate(formatDateForInput(transaction.date));
  }

  // 5. Salvar Alteração (PUT)
  async function handleUpdateTransaction(e: React.FormEvent) {
    e.preventDefault();

    if (!editingTransaction) return;

    try {
      const response = await api.put(`/transactions/${editingTransaction.id}`, {
        description: editDescription,
        amount: Number(editAmount),
        type: editType,
        category: editCategory,
        date: editDate,
      });

      setTransactions(
        transactions.map((t) => (t.id === editingTransaction.id ? { ...t, ...response.data } : t))
      );

      setEditingTransaction(null);
    } catch (error) {
      alert('Erro ao atualizar transação.');
    }
  }

  // 6. Confirmar Exclusão (DELETE)
  async function handleConfirmDelete() {
    if (!deletingTransaction) return;

    try {
      await api.delete(`/transactions/${deletingTransaction.id}`);
      setTransactions(transactions.filter((t) => t.id !== deletingTransaction.id));
      setDeletingTransaction(null);
    } catch (error) {
      alert('Erro ao excluir transação.');
    }
  }

  // Categorias disponíveis de acordo com o Tipo
  const currentCategories = type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const currentEditCategories = editType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Data padrão atual para comparação de cor no formulário de criação
  const todayDate = getTodayDateString();

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Gerenciador Financeiro</h1>

      {/* Cartões de Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: '#e6fffa', padding: '1rem', borderRadius: '8px', border: '1px solid #b2f5ea' }}>
          <span style={{ fontSize: '0.9rem', color: '#234e52' }}>Entradas</span>
          <h2 style={{ color: '#276749', margin: '0.5rem 0 0 0' }}>{formatCurrency(summary.income)}</h2>
        </div>

        <div style={{ background: '#fff5f5', padding: '1rem', borderRadius: '8px', border: '1px solid #fed7d7' }}>
          <span style={{ fontSize: '0.9rem', color: '#742a2a' }}>Saídas</span>
          <h2 style={{ color: '#9b2c2c', margin: '0.5rem 0 0 0' }}>{formatCurrency(summary.expense)}</h2>
        </div>

        <div style={{ 
          background: summary.total >= 0 ? '#ebf8ff' : '#fff5f5', 
          padding: '1rem', 
          borderRadius: '8px', 
          border: `1px solid ${summary.total >= 0 ? '#bee3f8' : '#fed7d7'}` 
        }}>
          <span style={{ fontSize: '0.9rem', color: summary.total >= 0 ? '#2c5282' : '#742a2a' }}>Saldo Total</span>
          <h2 style={{ color: summary.total >= 0 ? '#2b6cb0' : '#9b2c2c', margin: '0.5rem 0 0 0' }}>
            {formatCurrency(summary.total)}
          </h2>
        </div>
      </div>

      {/* Formulário de Cadastro */}
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
        <input 
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ 
            padding: '0.5rem',
            color: date === todayDate ? '#808080' : '#000000'
          }}
        />
        <select value={type} onChange={(e) => handleTypeChange(e.target.value)} style={{ padding: '0.5rem' }}>
          <option value="INCOME">Entrada (+)</option>
          <option value="EXPENSE">Saída (-)</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '0.5rem' }}>
          {currentCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button type="submit" style={{ padding: '0.75rem', background: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Adicionar Transação
        </button>
      </form>

      {/* Histórico com Data e Ações */}
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
              <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.2rem' }}>
                <span>{t.category}</span> • <span style={{ fontStyle: 'italic' }}>{formatDate(t.date)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 'bold', color: t.type === 'INCOME' ? '#38a169' : '#e53e3e', marginRight: '0.5rem' }}>
                {t.type === 'INCOME' ? '+ ' : '- '}{formatCurrency(t.amount)}
              </span>

              <button 
                onClick={() => handleOpenEditModal(t)}
                style={{ background: '#d69e2e', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
              >
                Editar
              </button>

              <button 
                onClick={() => setDeletingTransaction(t)}
                style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
              >
                Excluir
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Pop-up de Exclusão */}
      {deletingTransaction && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <h3>Confirmar Exclusão</h3>
            <p style={{ margin: '1rem 0', color: '#4a5568', lineHeight: '1.4' }}>
              Confirma a exclusão desta informação. Este comando excluirá permanentemente este dado.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button 
                onClick={() => setDeletingTransaction(null)} 
                style={{ padding: '0.5rem 1rem', background: '#cbd5e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmDelete} 
                style={{ padding: '0.5rem 1rem', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up de Alteração */}
      {editingTransaction && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <h3>Alterar Informações</h3>
            <form onSubmit={handleUpdateTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              
              <div>
                <label style={labelStyle}>Descrição</label>
                <input 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{
                    ...inputStyle,
                    color: editDescription === editingTransaction.description ? '#808080' : '#000000'
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>Valor (R$)</label>
                <input 
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  style={{
                    ...inputStyle,
                    color: editAmount === String(editingTransaction.amount) ? '#808080' : '#000000'
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>Data de Entrada</label>
                <input 
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  style={{
                    ...inputStyle,
                    color: editDate === formatDateForInput(editingTransaction.date) ? '#808080' : '#000000'
                  }}
                />
              </div>

              <div>
                <label style={labelStyle}>Tipo</label>
                <select 
                  value={editType} 
                  onChange={(e) => handleEditTypeChange(e.target.value)}
                  style={{
                    ...inputStyle,
                    color: editType === editingTransaction.type ? '#808080' : '#000000'
                  }}
                >
                  <option value="INCOME">Entrada (+)</option>
                  <option value="EXPENSE">Saída (-)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Categoria</label>
                <select 
                  value={editCategory} 
                  onChange={(e) => setEditCategory(e.target.value)}
                  style={{
                    ...inputStyle,
                    color: editCategory === editingTransaction.category ? '#808080' : '#000000'
                  }}
                >
                  {currentEditCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button 
                  type="button"
                  onClick={() => setEditingTransaction(null)} 
                  style={{ padding: '0.5rem 1rem', background: '#cbd5e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '0.5rem 1rem', background: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Alterar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalBoxStyle: React.CSSProperties = {
  background: '#fff',
  padding: '1.5rem',
  borderRadius: '8px',
  width: '100%',
  maxWidth: '450px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 'bold',
  color: '#4a5568',
  marginBottom: '0.25rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  borderRadius: '4px',
  border: '1px solid #cbd5e0',
  boxSizing: 'border-box',
};

export default App;