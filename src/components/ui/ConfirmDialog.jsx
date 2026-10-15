import React from 'react';
import { Trash2 } from 'lucide-react';

export default function ConfirmDialog({ message = 'Yakin ingin menghapus ini?', onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
          <Trash2 size={48} style={{ margin: '0 auto' }} />
          <h3 style={{ fontSize: '24px', fontWeight: '900', marginTop: '16px' }}>Hapus?</h3>
          <p style={{ marginTop: '8px', color: '#666' }}>{message}</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: '16px', background: '#fff', border: '2px solid #1A1D1E',
                borderRadius: '12px', fontWeight: '700', color: '#1A1D1E', cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1, padding: '16px', background: '#FFC0C0', border: '2px solid #1A1D1E',
                borderRadius: '12px', fontWeight: '700', boxShadow: '2px 2px 0px #1A1D1E',
                color: '#1A1D1E', cursor: 'pointer'
              }}
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
