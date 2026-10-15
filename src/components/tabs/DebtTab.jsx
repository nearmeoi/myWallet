import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, CreditCard, Users, Bell, AlertCircle, LoaderCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDebt } from '../../context/DebtContext';
import { formatRupiah } from '../../lib/utils';

export default function DebtTab({ user, onRequireAuth, onOpenModal, onDelete, addToast }) {
  const { session } = useAuth();
  const { debts, totalOwed, totalLent } = useDebt();
  const [activeTab, setActiveTab] = useState('owe'); // 'owe' = hutang, 'lend' = piutang
  const [sendingDebtId, setSendingDebtId] = useState(null);

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

  // Helper to calculate days remaining until deadline
  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Debts due in <= 3 days or overdue
  const dueSoonDebts = debts.filter(d => {
    if (d.status === 'paid' || !d.dueDate) return false;
    const days = getDaysRemaining(d.dueDate);
    return days !== null && days <= 3;
  });

  // Send debt reminder email via /api/send-debt-reminder
  const handleSendReminder = async (debt) => {
    if (!user) {
      if (addToast) addToast('Silakan login terlebih dahulu untuk menggunakan fitur pengingat email.', 'info');
      if (onRequireAuth) onRequireAuth();
      return;
    }

    setSendingDebtId(debt.id);
    try {
      const remaining = debt.totalAmount - (debt.paidAmount || 0);
      const headers = {
        'Content-Type': 'application/json'
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/send-debt-reminder', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          personName: debt.personName,
          amount: debt.totalAmount,
          remaining,
          dueDate: debt.dueDate,
          type: debt.type,
          notes: debt.notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim email pengingat.');
      }

      if (addToast) addToast(data.message || `Pengingat berhasil dikirim ke ${user.email}!`, 'success');
    } catch (err) {
      if (addToast) addToast(err.message || 'Gagal mengirim email pengingat.', 'error');
    } finally {
      setSendingDebtId(null);
    }
  };

  return (
    <>
      {/* Guest Mode Notice */}
      {!user && (
        <div style={{
          padding: '12px 14px', background: '#FEF9C3', border: '2px solid #1A1D1E',
          borderRadius: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '10px', boxShadow: '2px 2px 0px #1A1D1E'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#1A1D1E" />
            <div>
              <p style={{ fontSize: '13px', fontWeight: '800', margin: 0 }}>Mode Tamu</p>
              <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Login untuk mencatat hutang & piutang</p>
            </div>
          </div>
          <button
            onClick={onRequireAuth}
            style={{
              padding: '6px 12px', background: '#1A1D1E', color: '#FFFFFF',
              border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '800',
              fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >
            Login / Daftar
          </button>
        </div>
      )}

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

      {/* Due Soon Warning Banner */}
      {dueSoonDebts.length > 0 && (
        <div className="card" style={{
          background: '#FFC0C0', border: '2px solid #1A1D1E', padding: '14px',
          marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <AlertCircle size={24} color="#EF4444" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '13px', fontWeight: '800', color: '#1A1D1E', margin: 0 }}>
              Perhatian: {dueSoonDebts.length} catatan mendekati / lewat jatuh tempo!
            </p>
            <p style={{ fontSize: '11px', color: '#444', margin: '2px 0 0 0' }}>
              Gunakan tombol lonceng 🔔 pada kartu di bawah untuk mengirim notifikasi pengingat ke email Anda.
            </p>
          </div>
        </div>
      )}

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
            const daysRemaining = getDaysRemaining(debt.dueDate);
            const isDueSoon = !isPaid && daysRemaining !== null && daysRemaining <= 3;
            const isOverdue = !isPaid && daysRemaining !== null && daysRemaining < 0;

            return (
              <div
                key={debt.id}
                className="card"
                style={{ padding: '16px', margin: 0, opacity: isPaid ? 0.6 : 1 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '800' }}>{debt.personName}</h3>
                      <span style={{
                        fontSize: '10px', fontWeight: '700', padding: '2px 8px',
                        background: statusColor(debt.status), border: '1px solid #1A1D1E', borderRadius: '20px'
                      }}>
                        {statusLabel(debt.status)}
                      </span>

                      {/* Deadline Status Badge */}
                      {!isPaid && debt.dueDate && (
                        <span style={{
                          fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '20px',
                          border: '1px solid #1A1D1E',
                          background: isOverdue ? '#FFC0C0' : isDueSoon ? '#FEF9C3' : '#F3F4F6',
                          color: isOverdue ? '#EF4444' : '#1A1D1E'
                        }}>
                          {isOverdue 
                            ? `Lewat ${Math.abs(daysRemaining)} hari!` 
                            : daysRemaining === 0 
                              ? 'Jatuh tempo hari ini!' 
                              : `${daysRemaining} hari lagi`}
                        </span>
                      )}
                    </div>

                    {debt.notes && <p style={{ fontSize: '12px', color: '#666' }}>{debt.notes}</p>}
                    {debt.dueDate && (
                      <p style={{ fontSize: '12px', color: isOverdue ? '#EF4444' : '#666', marginTop: '2px', fontWeight: isOverdue ? '700' : '500' }}>
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

                    {/* Email Reminder Button */}
                    <button
                      onClick={() => handleSendReminder(debt)}
                      disabled={sendingDebtId === debt.id}
                      title="Kirim pengingat email ke alamat akun Anda"
                      className="btn-pressed-blue"
                      style={{
                        padding: '8px 12px', background: isDueSoon ? '#FEF9C3' : '#FFFFFF', border: '2px solid #1A1D1E',
                        borderRadius: '8px', fontWeight: '700', fontSize: '12px',
                        boxShadow: '2px 2px 0px #1A1D1E', cursor: sendingDebtId === debt.id ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                      }}
                    >
                      {sendingDebtId === debt.id ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <Bell size={14} color={isDueSoon ? '#D97706' : '#1A1D1E'} />
                      )}
                      <span>Ingatkan</span>
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
