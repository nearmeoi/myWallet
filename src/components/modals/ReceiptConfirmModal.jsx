import React from 'react';
import { CheckCircle2, X, Edit3, ArrowRight } from 'lucide-react';
import { formatRupiah } from '../../lib/utils';

export default function ReceiptConfirmModal({ 
  isOpen, 
  receiptData, 
  wallets = [], 
  categories = [], 
  onConfirm, 
  onEdit, 
  onCancel 
}) {
  if (!isOpen || !receiptData) return null;

  const matchedWallet = wallets.find(w => w.id?.toString() === receiptData.walletId?.toString()) 
    || wallets[0];
  const matchedCategory = categories.find(c => c.id === receiptData.category) 
    || { name: receiptData.category || 'Pengeluaran' };

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '380px', padding: '24px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '10px', background: '#D4F7E6', 
              border: '2px solid #1A1D1E', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <CheckCircle2 size={20} color="#16A34A" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#1A1D1E' }}>
                Struk {receiptData.bank || 'Bank'}!
              </h3>
              <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>
                Konfirmasi transaksi otomatis
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onCancel} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#1A1D1E' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Summary Card */}
        <div style={{
          background: '#FEF9C3', border: '2px solid #1A1D1E', borderRadius: '12px',
          padding: '16px', marginBottom: '20px', boxShadow: '3px 3px 0px #1A1D1E'
        }}>
          <p style={{ fontSize: '11px', fontWeight: '800', color: '#666', marginBottom: '2px' }}>
            TOTAL NOMINAL
          </p>
          <p style={{ fontSize: '28px', fontWeight: '900', color: '#1A1D1E', margin: '0 0 12px 0' }}>
            {formatRupiah(receiptData.amount)}
          </p>

          <div style={{ 
            display: 'flex', flexDirection: 'column', gap: '8px', 
            borderTop: '2px dashed #1A1D1E', paddingTop: '10px' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#666', fontWeight: '600' }}>Tujuan / Toko:</span>
              <strong style={{ 
                color: '#1A1D1E', textAlign: 'right', maxWidth: '180px', 
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
              }}>
                {receiptData.title || `Transaksi ${receiptData.bank}`}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#666', fontWeight: '600' }}>Dompet:</span>
              <strong style={{ color: '#1A1D1E' }}>
                {matchedWallet?.name || 'Dompet Utama'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#666', fontWeight: '600' }}>Kategori:</span>
              <strong style={{ color: '#1A1D1E' }}>
                {matchedCategory?.name || 'Lainnya'}
              </strong>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-pressed-blue"
            style={{
              width: '100%', padding: '14px', background: '#D4F7E6', border: '2px solid #1A1D1E',
              borderRadius: '10px', fontWeight: '900', fontSize: '14px', cursor: 'pointer',
              boxShadow: '3px 3px 0px #1A1D1E', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              color: '#1A1D1E'
            }}
          >
            <span>Ya, Simpan Transaksi</span>
            <ArrowRight size={18} />
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1, padding: '10px', background: '#FFFFFF', border: '2px solid #1A1D1E',
                borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                color: '#1A1D1E'
              }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onEdit}
              style={{
                flex: 1, padding: '10px', background: '#FFFFFF', border: '2px solid #1A1D1E',
                borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                color: '#1A1D1E'
              }}
            >
              <Edit3 size={14} />
              <span>Edit Detail</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
