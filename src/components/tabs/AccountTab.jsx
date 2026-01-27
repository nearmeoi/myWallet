import React from 'react';
import { User, LogOut, LoaderCircle, Cloud, Tag, ChevronRight, Briefcase, CreditCard, Smartphone, Edit3, Trash2 } from 'lucide-react';
import { formatRupiah } from '../../lib/utils';

const AccountTab = ({ 
  user, 
  authMode, 
  authEmail, 
  authPassword, 
  authError, 
  isSubmitting, 
  showResend, 
  syncing, 
  wallets, 
  onAuth, 
  onResend, 
  onLogout, 
  onSetAuthMode, 
  onSetAuthEmail, 
  onSetAuthPassword, 
  onSetAuthError, 
  onSetShowResend, 
  onSync, 
  onOpenModal, 
  onTabChange, 
  onDelete 
}) => {
  return (
    <>
      <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '20px' }}>Akun.</h2>

      {!user ? (
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '80px', height: '80px', margin: '0 auto 16px', background: '#FEF08A', border: '2px solid #1A1D1E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={40} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800' }}>{authMode === 'login' ? 'Login' : 'Daftar'}</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>Sinkronisasi data antar perangkat</p>
          </div>

          <form onSubmit={onAuth}>
            {authError && (
              <div style={{ padding: '12px', background: '#FFC0C0', border: '2px solid #1A1D1E', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                {authError}
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>EMAIL</label>
              <input type="email" value={authEmail} onChange={e => onSetAuthEmail(e.target.value)} placeholder="email@example.com" />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>PASSWORD</label>
              <input type="password" value={authPassword} onChange={e => onSetAuthPassword(e.target.value)} placeholder="••••••••" />
            </div>

            <button type="submit" disabled={isSubmitting} style={{
              width: '100%', padding: '14px', background: '#1A1D1E', color: '#fff',
              border: '2px solid #1A1D1E', borderRadius: '12px', fontWeight: '700',
              boxShadow: '4px 4px 0px rgba(0,0,0,0.2)', marginBottom: '12px',
              opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
              {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : null}
              {authMode === 'login' ? 'Login' : 'Daftar'}
            </button>

            {showResend && (
              <div style={{ 
                padding: '12px', background: '#FEF9C3', border: '2px solid #1A1D1E', 
                borderRadius: '8px', marginBottom: '16px', textAlign: 'center' 
              }}>
                <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Tidak menerima email?
                </p>
                <button type="button" onClick={onResend} disabled={isSubmitting} style={{
                  width: '100%', padding: '10px', background: '#1A1D1E', color: '#fff',
                  border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700',
                  fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}>
                  {isSubmitting ? <LoaderCircle size={14} className="animate-spin" /> : null}
                  Kirim Ulang Verifikasi
                </button>
              </div>
            )}

            <button type="button" onClick={() => {
              onSetAuthMode(authMode === 'login' ? 'register' : 'login');
              onSetAuthError('');
              onSetShowResend(false);
            }} style={{
              width: '100%', padding: '14px', background: '#FFFFFF', color: '#1A1D1E',
              border: '2px solid #1A1D1E', borderRadius: '12px', fontWeight: '700',
              boxShadow: '4px 4px 0px #1A1D1E'
            }}>
              {authMode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Login'}
            </button>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 16px', background: '#D4F7E6', border: '2px solid #1A1D1E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '32px', fontWeight: '800' }}>{user.email[0].toUpperCase()}</span>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px' }}>{user.email}</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#666', fontSize: '13px', marginBottom: '24px' }}>
            <Cloud size={14} /> Data tersinkronisasi
          </div>

          <button onClick={onLogout} style={{
            width: '100%', padding: '14px', background: '#FFC0C0', color: '#1A1D1E',
            border: '2px solid #1A1D1E', borderRadius: '12px', fontWeight: '700',
            boxShadow: '4px 4px 0px #1A1D1E', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      )}

      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Dompet Saya</h3>
          <button onClick={() => onOpenModal('wallet')} style={{
            padding: '6px 12px', background: '#BBEFFA', border: '2px solid #1A1D1E',
            borderRadius: '8px', fontSize: '12px', fontWeight: '700', boxShadow: '2px 2px 0px #1A1D1E'
          }}>
            + Tambah
          </button>
        </div>
        
        <div className="card" style={{ padding: '0', margin: 0, marginBottom: '24px' }}>
          {wallets.length === 0 ? (
             <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#666' }}>
               Belum ada dompet. Tambahkan sekarang!
             </div>
          ) : (
            wallets.map(w => (
              <div key={w.id} style={{ padding: '16px', borderBottom: '2px solid #1A1D1E', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '40px', height: '40px', border: '2px solid #1A1D1E', borderRadius: '8px', 
                  background: w.type === 'cash' ? '#D4F7E6' : w.type === 'bank' ? '#FEF9C3' : '#E0CCF8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {w.type === 'cash' ? <Briefcase size={20} /> : w.type === 'bank' ? <CreditCard size={20} /> : <Smartphone size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '700', fontSize: '14px' }}>{w.name}</p>
                  <p style={{ fontSize: '12px', color: '#666', textTransform: 'capitalize' }}>{w.type} • {formatRupiah(w.balance)}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => onOpenModal('wallet', '', w)} style={{ background: 'none', border: 'none' }}><Edit3 size={18} /></button>
                  <button onClick={() => onDelete(w.id)} style={{ background: 'none', border: 'none', color: '#EF4444' }}><Trash2 size={18} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Pengaturan</h3>
        <div className="card" style={{ padding: '0', margin: 0 }}>
          <div onClick={() => onTabChange('categories')} style={{ padding: '16px', borderBottom: '2px solid #1A1D1E', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <Tag size={20} />
            <span style={{ flex: 1, fontWeight: '600' }}>Kelola Kategori</span>
            <ChevronRight size={20} color="#999" />
          </div>
          {user && (
            <div onClick={onSync} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              {syncing ? <LoaderCircle size={20} className="animate-spin" /> : <Cloud size={20} />}
              <span style={{ flex: 1, fontWeight: '600' }}>{syncing ? 'Syncing...' : 'Sync Sekarang'}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AccountTab;
