import React from 'react';
import { Tag, Edit3, Trash2 } from 'lucide-react';
import { AVAILABLE_ICONS } from '../../lib/constants';

const CategoriesTab = ({ 
  incomeCategories, 
  expenseCategories, 
  onOpenModal, 
  onDelete 
}) => {
  return (
    <>
      <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '20px' }}>Kategori.</h2>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Pemasukan</h3>
          <button onClick={() => onOpenModal('category', 'income')} style={{
            padding: '6px 12px', background: '#D4F7E6', border: '2px solid #1A1D1E',
            borderRadius: '8px', fontSize: '12px', fontWeight: '700', boxShadow: '2px 2px 0px #1A1D1E'
          }}>
            + Tambah
          </button>
        </div>
        <div className="card" style={{ padding: '0', margin: 0 }}>
          {incomeCategories.map(cat => {
            const IconComp = AVAILABLE_ICONS[cat.icon] || Tag;
            return (
              <div key={cat.id} style={{ padding: '12px 16px', borderBottom: '2px solid #1A1D1E', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', background: cat.bg, border: '2px solid #1A1D1E', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconComp size={18} />
                </div>
                <span style={{ flex: 1, fontWeight: '600' }}>{cat.name}</span>
                {!cat.isDefault && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => onOpenModal('category', 'income', cat)} style={{ background: 'none', border: 'none' }}><Edit3 size={18} /></button>
                    <button onClick={() => onDelete(cat.id)} style={{ background: 'none', border: 'none', color: '#EF4444' }}><Trash2 size={18} /></button>
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
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Pengeluaran</h3>
          <button onClick={() => onOpenModal('category', 'expense')} style={{
            padding: '6px 12px', background: '#FFC0C0', border: '2px solid #1A1D1E',
            borderRadius: '8px', fontSize: '12px', fontWeight: '700', boxShadow: '2px 2px 0px #1A1D1E'
          }}>
            + Tambah
          </button>
        </div>
        <div className="card" style={{ padding: '0', margin: 0 }}>
          {expenseCategories.map(cat => {
            const IconComp = AVAILABLE_ICONS[cat.icon] || Tag;
            return (
              <div key={cat.id} style={{ padding: '12px 16px', borderBottom: '2px solid #1A1D1E', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', background: cat.bg, border: '2px solid #1A1D1E', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconComp size={18} />
                </div>
                <span style={{ flex: 1, fontWeight: '600' }}>{cat.name}</span>
                {!cat.isDefault && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => onOpenModal('category', 'expense', cat)} style={{ background: 'none', border: 'none' }}><Edit3 size={18} /></button>
                    <button onClick={() => onDelete(cat.id)} style={{ background: 'none', border: 'none', color: '#EF4444' }}><Trash2 size={18} /></button>
                  </div>
                )}
                {cat.isDefault && <span style={{ fontSize: '11px', color: '#999', background: '#F3F4F6', padding: '2px 8px', borderRadius: '10px' }}>Default</span>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default CategoriesTab;
