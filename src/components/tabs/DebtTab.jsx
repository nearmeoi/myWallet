import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, CreditCard, Users } from 'lucide-react';
import { useDebt } from '../../context/DebtContext';
import { formatRupiah } from '../../lib/utils';

export default function DebtTab({ onOpenModal, onDelete }) {
  const { debts, totalOwed, totalLent } = useDebt();
  const [activeTab, setActiveTab] = useState('owe'); // 'owe' = hutang, 'lend' = piutang

  const filtered = debts.filter(d => d.type === activeTab);

  const statusColor = (status) => {
    if (status === 'paid') return '#D4F7E6';
    if (status === 'partial') return '#FEF9C3';
    return '#FFC0C0';
  };

  const statusLabel = (status) => {
    if (status === 'paid') return 'Lunas';
    if (status === 'partial') return 'Cicilan';
    return 'Belum Bayar';
  };

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900' }}>Hutang & Piutang.</h2>
        <button
          onClick={() => onOpenModal('debt')}
          style={{
            width: '44px', height: '44px', background: '#FFC0C0', border: '2px solid #1A1D1E',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '4px 4px 0px #1A1D1E', color: '#1A1D1E', cursor: 'pointer'
          }}
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div className="card" style={{ flex: 1, padding: '16px', margin: 0, background: '#FFC0C0' }}>
          <p style={{ fontSize: '11px', fontWeight: '800', marginBottom: '4px' }}>HUTANG SAYA</p>
          <p style={{ fontSize: '18px', fontWeight: '900' }}>{formatRupiah(totalOwed)}</p>
        </div>
        <div className="card" style={{ flex: 1, padding: '16px', margin: 0, background: '#D4F7E6' }}>
          <p style={{ fontSize: '11px', fontWeight: '800', marginBottom: '4px' }}>PIUTANG SAYA</p>
          <p style={{ fontSize: '18px', fontWeight: '900' }}>{formatRupiah(totalLent)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[{ key: 'owe', label: 'Hutang Saya' }, { key: 'lend', label: 'Piutang Saya' }].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              flex: 1, padding: '10px', border: '2px solid #1A1D1E', borderRadius: '8px',
              background: activeTab === t.key ? '#1A1D1E' : '#FFFFFF',
              color: activeTab === t.key ? '#FFFFFF' : '#1A1D1E',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer',
              boxShadow: activeTab === t.key ? 'none' : '2px 2px 0px #1A1D1E'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Debt List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', background: '#F3F4F6' }}>
            <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontWeight: '700' }}>Tidak ada {activeTab === 'owe' ? 'hutang' : 'piutang'}.</p>
            <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>Tap + untuk menambahkan.</p>
          </div>
        ) : (
          filtered.map(debt => {
            const remaining = debt.totalAmount - (debt.paidAmount || 0);
            const progress = debt.totalAmount > 0 ? ((debt.paidAmount || 0) / debt.totalAmount) * 100 : 0;
            const isPaid = debt.status === 'paid';
            return (
              <div
                key={debt.id}
                className="card"
                style={{ padding: '16px', margin: 0, opacity: isPaid ? 0.6 : 1 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '800' }}>{debt.personName}</h3>
                      <span style={{
                        fontSize: '10px', fontWeight: '700', padding: '2px 8px',
                        background: statusColor(debt.status), border: '1px solid #1A1D1E', borderRadius: '20px'
                      }}>
                        {statusLabel(debt.status)}
                      </span>
                    </div>
                    {debt.notes && <p style={{ fontSize: '12px', color: '#666' }}>{debt.notes}</p>}
                    {debt.dueDate && (
                      <p style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                        Jatuh tempo: {new Date(debt.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '16px', fontWeight: '900' }}>{formatRupiah(debt.totalAmount)}</p>
                    {remaining > 0 && (
                      <p style={{ fontSize: '12px', color: '#EF4444', fontWeight: '700' }}>Sisa: {formatRupiah(remaining)}</p>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ height: '8px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(progress, 100)}%`,
                      background: isPaid ? '#D4F7E6' : '#BBEFFA',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <p style={{ fontSize: '11px', color: '#666', marginTop: '4px', textAlign: 'right' }}>
                    {Math.round(progress)}% terbayar
                  </p>
                </div>

                {/* Actions */}
                {!isPaid && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => onOpenModal('debtPayment', '', debt)}
                      className="btn-pressed-blue"
                      style={{
                        flex: 1, padding: '8px', background: '#BBEFFA', border: '2px solid #1A1D1E',
                        borderRadius: '8px', fontWeight: '700', fontSize: '12px',
                        boxShadow: '2px 2px 0px #1A1D1E', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                      }}
                    >
                      <CreditCard size={14} /> Bayar
                    </button>
                    <button
                      onClick={() => onDelete(debt.id, 'debt')}
                      style={{
                        width: '36px', height: '36px', background: '#FFC0C0', border: '2px solid #1A1D1E',
                        borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '2px 2px 0px #1A1D1E', cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                {isPaid && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e' }}>
                    <CheckCircle size={16} />
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>Lunas!</span>
                    <button
                      onClick={() => onDelete(debt.id, 'debt')}
                      style={{
                        marginLeft: 'auto', width: '32px', height: '32px', background: 'none',
                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={14} color="#EF4444" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
