import React from 'react';
import { Tag, Edit3, Trash2 } from 'lucide-react';
import { AVAILABLE_ICONS } from '../../lib/constants';
import { formatRupiah } from '../../lib/utils';

const CategoriesTab = ({ 
  incomeCategories, 
  expenseCategories, 
  transactions = [],
  onOpenModal, 
  onDelete 
}) => {

  const calculateSpent = (catId) => {
    const now = new Date();
    return transactions
      .filter(t => 
        t.category === catId && 
        t.type === 'expense' &&
        new Date(t.timestamp).getMonth() === now.getMonth() &&
        new Date(t.timestamp).getFullYear() === now.getFullYear()
      )
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  return (
    <>
      <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '20px' }}>Kategori.</h2>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1D1E' }}>Pemasukan</h3>
          <button onClick={() => onOpenModal('category', 'income')} style={{
            padding: '6px 12px', background: '#D4F7E6', border: '2px solid #1A1D1E',
            borderRadius: '8px', fontSize: '12px', fontWeight: '700', boxShadow: '2px 2px 0px #1A1D1E',
            color: '#1A1D1E', cursor: 'pointer'
          }}>
            + Tambah
          </button>
        </div>
        <div className="card" style={{ padding: '0', margin: 0 }}>
          {incomeCategories.map(cat => {
            const IconComp = AVAILABLE_ICONS[cat.icon] || Tag;
            return (
              <div key={cat.id} style={{ padding: '16px', borderBottom: '2px solid #1A1D1E', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: cat.bg, border: '2px solid #1A1D1E', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconComp size={20} color="#1A1D1E" />
                </div>
                <span style={{ flex: 1, fontWeight: '700', color: '#1A1D1E' }}>{cat.name}</span>
                {!cat.isDefault && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => onOpenModal('category', 'income', cat)} style={{ background: 'none', border: 'none', color: '#1A1D1E', cursor: 'pointer' }}><Edit3 size={18} color="#1A1D1E" /></button>
                    <button onClick={() => onDelete(cat.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={18} color="#EF4444" /></button>
                  </div>
                )}
                {cat.isDefault && <span style={{ fontSize: '11px', color: '#999', background: '#F3F4F6', padding: '2px 8px', borderRadius: '10px' }}>Default</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1D1E' }}>Pengeluaran</h3>
          <button onClick={() => onOpenModal('category', 'expense')} style={{
            padding: '6px 12px', background: '#FFC0C0', border: '2px solid #1A1D1E',
            borderRadius: '8px', fontSize: '12px', fontWeight: '700', boxShadow: '2px 2px 0px #1A1D1E',
            color: '#1A1D1E', cursor: 'pointer'
          }}>
            + Tambah
          </button>
        </div>
        <div className="card" style={{ padding: '0', margin: 0 }}>
          {expenseCategories.map(cat => {
            const IconComp = AVAILABLE_ICONS[cat.icon] || Tag;
            const spent = calculateSpent(cat.id);
            const limit = cat.budgetLimit || 0;
            const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            const isOver = limit > 0 && spent > limit;

            return (
              <div key={cat.id} style={{ padding: '16px', borderBottom: '2px solid #1A1D1E' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: limit > 0 ? '8px' : '0' }}>
                  <div style={{ width: '40px', height: '40px', background: cat.bg, border: '2px solid #1A1D1E', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconComp size={20} color="#1A1D1E" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', color: '#1A1D1E' }}>{cat.name}</span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button onClick={() => onOpenModal('category', 'expense', cat)} style={{ 
                          padding: '4px 8px', background: '#FFFFFF', border: '1px solid #1A1D1E', 
                          borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                          display: 'flex', alignItems: 'center', gap: '4px', color: '#1A1D1E', cursor: 'pointer'
                        }}>
                          <Edit3 size={12} color="#1A1D1E" /> Budget
                        </button>
                        {!cat.isDefault && (
                          <button onClick={() => onDelete(cat.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                            <Trash2 size={18} color="#EF4444" />
                          </button>
                        )}
                        {cat.isDefault && <span style={{ fontSize: '10px', color: '#999', background: '#F3F4F6', padding: '2px 6px', borderRadius: '10px' }}>Default</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {limit > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', fontWeight: '600', color: isOver ? '#EF4444' : '#666' }}>
                      <span>Terpakai: {formatRupiah(spent)}</span>
                      <span>Jatah: {formatRupiah(limit)}</span>
                    </div>
                    <div style={{ height: '8px', background: '#F3F4F6', borderRadius: '4px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${percentage}%`, 
                        background: isOver ? '#EF4444' : cat.bg, // Use category color for bar
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    {isOver && <p style={{ fontSize: '11px', color: '#EF4444', fontWeight: '700', marginTop: '4px' }}>Melebihi jatah!</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default CategoriesTab;