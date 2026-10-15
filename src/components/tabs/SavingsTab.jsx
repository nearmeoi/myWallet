import React from 'react';
import { Plus, Trash2, Target, PiggyBank } from 'lucide-react';
import { useSavings } from '../../context/SavingsContext';
import { formatRupiah } from '../../lib/utils';
import { PRESET_COLORS, AVAILABLE_ICONS } from '../../lib/constants';

export default function SavingsTab({ onOpenModal, onDelete }) {
  const { savings, totalSaved } = useSavings();

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900' }}>Tabungan.</h2>
        <button
          onClick={() => onOpenModal('saving')}
          style={{
            width: '44px', height: '44px', background: '#D4F7E6', border: '2px solid #1A1D1E',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '4px 4px 0px #1A1D1E', color: '#1A1D1E', cursor: 'pointer'
          }}
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Summary */}
      <div className="card" style={{ background: '#D4F7E6', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>TOTAL UANG TERSIMPAN</p>
        <p style={{ fontSize: '32px', fontWeight: '900' }}>{formatRupiah(totalSaved)}</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>dari {savings.length} kantong tabungan</p>
      </div>

      {/* Savings List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {savings.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', background: '#F3F4F6' }}>
            <PiggyBank size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontWeight: '700' }}>Belum ada tabungan.</p>
            <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>Tap + untuk membuat kantong tabungan baru.</p>
          </div>
        ) : (
          savings.map(saving => {
            const progress = saving.targetAmount > 0
              ? Math.min((saving.currentAmount / saving.targetAmount) * 100, 100)
              : 0;
            const remaining = Math.max(0, saving.targetAmount - saving.currentAmount);
            const IconComp = AVAILABLE_ICONS[saving.icon] || Target;

            return (
              <div key={saving.id} className="card" style={{ margin: 0 }}>
                {/* Top Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '48px', height: '48px', background: saving.color || '#D4F7E6',
                    border: '2px solid #1A1D1E', borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <IconComp size={24} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '2px' }}>{saving.name}</h3>
                    {saving.deadline && (
                      <p style={{ fontSize: '11px', color: '#666' }}>
                        Target: {new Date(saving.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  {saving.isCompleted && (
                    <span style={{
                      fontSize: '11px', fontWeight: '800', padding: '4px 10px',
                      background: '#D4F7E6', border: '2px solid #1A1D1E', borderRadius: '20px'
                    }}>✓ Tercapai!</span>
                  )}
                </div>

                {/* Amount Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>TERKUMPUL</p>
                    <p style={{ fontSize: '18px', fontWeight: '900' }}>{formatRupiah(saving.currentAmount)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>TARGET</p>
                    <p style={{ fontSize: '18px', fontWeight: '900' }}>{formatRupiah(saving.targetAmount)}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ height: '10px', background: '#F3F4F6', border: '2px solid #1A1D1E', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${progress}%`,
                      background: saving.color || '#D4F7E6',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>{Math.round(progress)}%</span>
                    {remaining > 0 && <span style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>Kurang {formatRupiah(remaining)}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onOpenModal('savingTopUp', '', saving)}
                    className="btn-pressed-blue"
                    style={{
                      flex: 1, padding: '8px', background: '#D4F7E6', border: '2px solid #1A1D1E',
                      borderRadius: '8px', fontWeight: '700', fontSize: '12px',
                      boxShadow: '2px 2px 0px #1A1D1E', cursor: 'pointer'
                    }}
                  >
                    + Tabung
                  </button>
                  {saving.currentAmount > 0 && (
                    <button
                      onClick={() => onOpenModal('savingWithdraw', '', saving)}
                      className="btn-pressed-blue"
                      style={{
                        flex: 1, padding: '8px', background: '#FEF9C3', border: '2px solid #1A1D1E',
                        borderRadius: '8px', fontWeight: '700', fontSize: '12px',
                        boxShadow: '2px 2px 0px #1A1D1E', cursor: 'pointer'
                      }}
                    >
                      Tarik
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(saving.id, 'saving')}
                    style={{
                      width: '36px', height: '36px', background: '#FFC0C0', border: '2px solid #1A1D1E',
                      borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '2px 2px 0px #1A1D1E', cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
