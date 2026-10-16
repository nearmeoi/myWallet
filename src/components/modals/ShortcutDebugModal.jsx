import React, { useState } from 'react';
import { X, Bug, Clipboard, Terminal, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { parseReceiptText } from '../../lib/receiptParser';
import { formatRupiah } from '../../lib/utils';

export default function ShortcutDebugModal({ isOpen, onClose, onTriggerReceipt }) {
  const [clipboardStatus, setClipboardStatus] = useState(null);
  const [clipboardText, setClipboardText] = useState('');
  const [parsedPreview, setParsedPreview] = useState(null);

  if (!isOpen) return null;

  const isStandalone = window.navigator.standalone === true || 
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);

  const currentHref = window.location.href;
  const currentSearch = window.location.search;
  const currentHash = window.location.hash;
  const pendingStorage = localStorage.getItem('mywallet_pending_receipt');

  const handleTestClipboard = async () => {
    setClipboardStatus('reading');
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        setClipboardStatus('error');
        setClipboardText('API navigator.clipboard.readText tidak didukung di browser ini.');
        return;
      }

      const text = await navigator.clipboard.readText();
      setClipboardText(text || '(Papan klip kosong)');

      if (text && text.trim().length > 0) {
        const parsed = parseReceiptText(text);
        setParsedPreview(parsed);
        if (parsed.success && parsed.amount > 0) {
          setClipboardStatus('success');
        } else {
          setClipboardStatus('no_amount');
        }
      } else {
        setClipboardStatus('empty');
      }
    } catch (err) {
      setClipboardStatus('error');
      setClipboardText(`Izin ditolak atau gagal: ${err?.message || err}`);
    }
  };

  const handleApplyClipboardReceipt = () => {
    if (parsedPreview && parsedPreview.success && parsedPreview.amount > 0) {
      onTriggerReceipt({
        title: parsedPreview.title || `Transaksi ${parsedPreview.bank}`,
        amount: parsedPreview.amount,
        bank: parsedPreview.bank,
        category: parsedPreview.category || 'other_expense',
        walletId: ''
      });
      onClose();
    }
  };

  const handleSimulateMandiri = () => {
    onTriggerReceipt({
      title: 'Tokopedia Digital',
      amount: 105655,
      bank: 'Mandiri',
      category: 'shopping',
      walletId: ''
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '440px', padding: 0 }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', background: '#FEF08A',
              border: '2px solid #1A1D1E', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bug size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '900', margin: 0 }}>
                Diagnostik URL & Shortcut
              </h3>
              <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>
                Pemeriksa parameter & lingkungan iOS
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: '16px' }}>
          {/* Status Box */}
          <div style={{
            padding: '12px', background: isStandalone ? '#D4F7E6' : '#EFF6FF',
            border: '2px solid #1A1D1E', borderRadius: '10px', marginBottom: '16px'
          }}>
            <p style={{ fontSize: '12px', fontWeight: '800', margin: '0 0 2px 0' }}>
              LINGKUNGAN APLIKASI SAAT INI:
            </p>
            <p style={{ fontSize: '14px', fontWeight: '900', margin: 0 }}>
              {isStandalone ? '📱 Layar Utama (PWA Standalone)' : '🌐 Browser Web (Safari)'}
            </p>
            {isStandalone && (
              <p style={{ fontSize: '11px', color: '#047857', margin: '4px 0 0 0' }}>
                💡 iOS WebKit secara bawaan memotong query <code>?receipt=</code> saat membuka via <code>webapp://</code>. Gunakan Clipboard atau hash <code>#receipt=</code>.
              </p>
            )}
          </div>

          {/* URL Breakdown */}
          <div style={{
            background: '#F3F4F6', border: '2px solid #1A1D1E', borderRadius: '10px',
            padding: '12px', marginBottom: '16px', fontSize: '11px', fontFamily: 'monospace'
          }}>
            <p style={{ fontWeight: '800', fontFamily: 'var(--font-main)', margin: '0 0 8px 0', fontSize: '12px' }}>
              DATA URL YANG DITERIMA:
            </p>
            
            <div style={{ marginBottom: '8px' }}>
              <strong>Search Query (?):</strong>
              <div style={{ 
                background: '#FFFFFF', padding: '6px 8px', borderRadius: '6px', 
                border: '1px solid #1A1D1E', marginTop: '2px', wordBreak: 'break-all' 
              }}>
                {currentSearch || <span style={{ color: '#EF4444' }}>(Kosong - tidak ada parameter ?)</span>}
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <strong>Hash Fragment (#):</strong>
              <div style={{ 
                background: '#FFFFFF', padding: '6px 8px', borderRadius: '6px', 
                border: '1px solid #1A1D1E', marginTop: '2px', wordBreak: 'break-all' 
              }}>
                {currentHash || <span style={{ color: '#666' }}>(Kosong)</span>}
              </div>
            </div>

            <div>
              <strong>Pending Struk di Storage:</strong>
              <div style={{ 
                background: '#FFFFFF', padding: '6px 8px', borderRadius: '6px', 
                border: '1px solid #1A1D1E', marginTop: '2px', wordBreak: 'break-all' 
              }}>
                {pendingStorage ? 'Tersimpan (Aktif)' : '(Tidak ada struk tertunda)'}
              </div>
            </div>
          </div>

          {/* Test Clipboard Button */}
          <div style={{
            border: '2px solid #1A1D1E', borderRadius: '10px', padding: '14px',
            background: '#FFFFFF', marginBottom: '16px'
          }}>
            <p style={{ fontSize: '13px', fontWeight: '800', margin: '0 0 4px 0' }}>
              📋 Uji Baca Clipboard (Papan Klip)
            </p>
            <p style={{ fontSize: '11px', color: '#666', margin: '0 0 10px 0' }}>
              Jika Anda menyalin struk di Shortcuts, tekan tombol ini untuk melihat apakah teks terbaca oleh aplikasi:
            </p>
            
            <button
              type="button"
              onClick={handleTestClipboard}
              className="btn-pressed-blue"
              style={{
                width: '100%', padding: '10px 14px', background: '#FEF08A',
                border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '800',
                fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', boxShadow: '2px 2px 0px #1A1D1E'
              }}
            >
              <Clipboard size={16} />
              <span>Baca Teks dari Clipboard Sekarang</span>
            </button>

            {clipboardStatus && (
              <div style={{ marginTop: '12px', fontSize: '12px' }}>
                {clipboardStatus === 'reading' && <p>Membaca clipboard...</p>}
                
                {clipboardStatus === 'success' && parsedPreview && (
                  <div style={{ padding: '10px', background: '#D4F7E6', border: '1.5px solid #1A1D1E', borderRadius: '8px' }}>
                    <p style={{ fontWeight: '800', color: '#16A34A', margin: '0 0 4px 0' }}>
                      ✓ Struk Berhasil Terdeteksi!
                    </p>
                    <p style={{ margin: '2px 0' }}>Bank: <strong>{parsedPreview.bank}</strong></p>
                    <p style={{ margin: '2px 0' }}>Nominal: <strong>{formatRupiah(parsedPreview.amount)}</strong></p>
                    <p style={{ margin: '2px 0' }}>Tujuan: <strong>{parsedPreview.title}</strong></p>
                    <button
                      type="button"
                      onClick={handleApplyClipboardReceipt}
                      style={{
                        marginTop: '8px', width: '100%', padding: '8px',
                        background: '#1A1D1E', color: '#FFFFFF', border: 'none',
                        borderRadius: '6px', fontWeight: '800', fontSize: '12px', cursor: 'pointer'
                      }}
                    >
                      Buka Pop-Up Konfirmasi Struk Ini →
                    </button>
                  </div>
                )}

                {clipboardStatus === 'no_amount' && (
                  <div style={{ padding: '8px', background: '#FEF9C3', border: '1.5px solid #1A1D1E', borderRadius: '8px' }}>
                    <p style={{ fontWeight: '700', margin: 0 }}>
                      ⚠️ Teks terbaca ({clipboardText.length} karakter), tetapi tidak ada nominal rupiah yang cocok.
                    </p>
                  </div>
                )}

                {clipboardStatus === 'error' && (
                  <div style={{ padding: '8px', background: '#FFC0C0', border: '1.5px solid #1A1D1E', borderRadius: '8px' }}>
                    <p style={{ fontWeight: '700', margin: 0 }}>{clipboardText}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Test Simulator Button */}
          <div style={{
            border: '2px solid #1A1D1E', borderRadius: '10px', padding: '14px',
            background: '#FAFAFA'
          }}>
            <p style={{ fontSize: '13px', fontWeight: '800', margin: '0 0 4px 0' }}>
              🧪 Simulasi Langsung Pop-Up Tokopedia (Rp 105.655)
            </p>
            <p style={{ fontSize: '11px', color: '#666', margin: '0 0 10px 0' }}>
              Memaksa pop-up konfirmasi muncul untuk memastikan modal UI berfungsi di layar iPhone Anda:
            </p>
            <button
              type="button"
              onClick={handleSimulateMandiri}
              className="btn-pressed-blue"
              style={{
                width: '100%', padding: '10px 14px', background: '#D4F7E6',
                border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '800',
                fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px', boxShadow: '2px 2px 0px #1A1D1E'
              }}
            >
              <span>Munculkan Pop-Up Konfirmasi Sekarang</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
