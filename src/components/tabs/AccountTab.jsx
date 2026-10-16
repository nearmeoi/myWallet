import React, { useState } from 'react';
import { 
  User, LogOut, LoaderCircle, Cloud, Tag, ChevronRight, Banknote, 
  CreditCard, Smartphone, Edit3, Trash2, Save, PieChart, Zap, Key, Copy, Check, Info, ExternalLink
} from 'lucide-react';
import { formatRupiah } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { IOS_SHORTCUT_URL } from '../../lib/constants';

const AccountTab = ({ 
  user, 
  authMode, 
  authEmail, 
  authPassword, 
  authConfirmPassword,
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
  onSetAuthConfirmPassword,
  onSetAuthError, 
  onSetShowResend, 
  onSync, 
  onOpenModal, 
  onTabChange, 
  onDelete,
  addToast
}) => {
  const { updateProfile } = useAuth();
  const [profileName, setProfileName] = useState(user?.user_metadata?.username || '');
  const [showShortcutInfo, setShowShortcutInfo] = useState(false);
  const [shortcutMode, setShortcutMode] = useState('simple');
  const [urlType, setUrlType] = useState('pwa'); // 'pwa' | 'safari'
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  const shortcutUrlTemplate = urlType === 'pwa' 
    ? `webapp://${window.location.host}/?receipt=` 
    : `${window.location.origin}/?receipt=`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shortcutUrlTemplate);
    setCopiedUrl(true);
    addToast(`URL Pintasan (${urlType === 'pwa' ? 'Homescreen' : 'Safari'}) berhasil disalin!`, 'success');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  React.useEffect(() => {
    if (user?.user_metadata?.username) {
      setProfileName(user.user_metadata.username);
    }
  }, [user?.user_metadata?.username]);

  const displayName = (user?.user_metadata?.username || profileName || '').trim();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  const shortcutApiKey = user?.user_metadata?.shortcut_api_key || '';

  const handleGenerateApiKey = async () => {
    setIsGeneratingKey(true);
    try {
      const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      const newKey = `mw_${randomBytes}`;

      const { error } = await updateProfile({ shortcut_api_key: newKey });
      if (error) throw error;
      addToast('Kunci API iOS Shortcut berhasil dibuat!', 'success');
    } catch (err) {
      addToast('Gagal membuat kunci API: ' + err.message, 'error');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleCopyKey = () => {
    if (!shortcutApiKey) return;
    navigator.clipboard.writeText(shortcutApiKey);
    setCopiedKey(true);
    addToast('Kunci API berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    
    setIsUpdating(true);
    try {
      const { error } = await updateProfile({ username: profileName });
      if (error) throw error;
      addToast('Profil diperbarui!');
      setShowProfileEdit(false);
    } catch (err) {
      addToast('Gagal memperbarui profil: ' + err.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <h2 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '20px' }}>Akun.</h2>

      {!user ? (
        <div className="card" style={{ padding: '32px' }}>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ width: '80px', height: '80px', margin: '0 auto 16px', background: authMode === 'login' ? '#FEF08A' : '#D4F7E6', border: '2px solid #1A1D1E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={40} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800' }}>{authMode === 'login' ? 'Login Akun' : 'Daftar Akun Baru'}</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>
              {authMode === 'login' ? 'Masuk ke akun myWallet Anda' : 'Buat akun untuk sinkronisasi data antar perangkat'}
            </p>
          </div>

          <form onSubmit={onAuth}>
            {authError && (
              <div style={{ padding: '12px', background: '#FFC0C0', border: '2px solid #1A1D1E', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                {authError}
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>EMAIL</label>
              <input type="email" value={authEmail} onChange={e => onSetAuthEmail(e.target.value)} placeholder="email@example.com" required />
            </div>

            <div style={{ marginBottom: authMode === 'register' ? '12px' : '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>PASSWORD</label>
              <input 
                type="password" 
                value={authPassword} 
                onChange={e => onSetAuthPassword(e.target.value)} 
                placeholder={authMode === 'register' ? 'Minimal 6 karakter' : '••••••••'} 
                required 
              />
            </div>

            {authMode === 'register' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>KONFIRMASI PASSWORD</label>
                <input 
                  type="password" 
                  value={authConfirmPassword} 
                  onChange={e => onSetAuthConfirmPassword(e.target.value)} 
                  placeholder="Ketik ulang password di atas" 
                  required 
                />
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-pressed-blue" style={{
              width: '100%', padding: '14px', background: '#1A1D1E', color: '#fff',
              border: '2px solid #1A1D1E', borderRadius: '12px', fontWeight: '700',
              boxShadow: '4px 4px 0px rgba(0,0,0,0.2)', marginBottom: '12px',
              opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
              {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : null}
              {authMode === 'login' ? 'Login' : 'Daftar Sekarang'}
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
              if (onSetAuthConfirmPassword) onSetAuthConfirmPassword('');
            }} style={{
              width: '100%', padding: '14px', background: '#FFFFFF', color: '#1A1D1E',
              border: '2px solid #1A1D1E', borderRadius: '12px', fontWeight: '700',
              boxShadow: '4px 4px 0px #1A1D1E', cursor: 'pointer'
            }}>
              {authMode === 'login' ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Login di sini'}
            </button>
          </form>
        </div>
      ) : (
        <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', margin: '0 auto 16px', background: '#D4F7E6', border: '2px solid #1A1D1E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '32px', fontWeight: '800' }}>
              {(displayName || user.email)[0].toUpperCase()}
            </span>
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px', color: '#1A1D1E' }}>
            {displayName || user.email.split('@')[0]}
          </h3>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '14px', fontWeight: '500' }}>
            {user.email}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#666', fontSize: '12px', marginBottom: '24px' }}>
            <Cloud size={14} /> Data tersinkronisasi
          </div>

          <button onClick={onLogout} className="btn-pressed-blue" style={{
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
          <button onClick={() => onOpenModal('wallet')} className="btn-pressed-blue" style={{
            padding: '6px 12px', background: '#BBEFFA', border: '2px solid #1A1D1E',
            borderRadius: '8px', fontSize: '12px', fontWeight: '700', boxShadow: '2px 2px 0px #1A1D1E',
            color: '#1A1D1E', cursor: 'pointer'
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
                  {w.type === 'cash' ? <Banknote size={20} /> : w.type === 'bank' ? <CreditCard size={20} /> : <Smartphone size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '700', fontSize: '14px', color: '#1A1D1E' }}>{w.name}</p>
                  <p style={{ fontSize: '12px', color: '#666', textTransform: 'capitalize' }}>{w.type} • {formatRupiah(w.balance)}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => onOpenModal('wallet', '', w)} style={{ background: 'none', border: 'none', color: '#1A1D1E', cursor: 'pointer' }}><Edit3 size={18} color="#1A1D1E" /></button>
                  <button onClick={() => onDelete(w.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={18} color="#EF4444" /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Pengaturan & Fitur</h3>
        <div className="card" style={{ padding: '0', margin: 0 }}>
          <div onClick={() => onTabChange('wallet')} style={{ padding: '16px', borderBottom: '2px solid #1A1D1E', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <PieChart size={20} />
            <span style={{ flex: 1, fontWeight: '600' }}>Ringkasan & Budget Bulanan</span>
            <ChevronRight size={20} color="#999" />
          </div>
          <div onClick={() => onTabChange('categories')} style={{ padding: '16px', borderBottom: '2px solid #1A1D1E', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <Tag size={20} />
            <span style={{ flex: 1, fontWeight: '600' }}>Kelola Kategori</span>
            <ChevronRight size={20} color="#999" />
          </div>
          {user && (
            <div onClick={onSync} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderBottom: '2px solid #1A1D1E' }}>
              {syncing ? <LoaderCircle size={20} className="animate-spin" /> : <Cloud size={20} />}
              <span style={{ flex: 1, fontWeight: '600' }}>{syncing ? 'Syncing...' : 'Sync Sekarang'}</span>
            </div>
          )}
          {user && (
            <div style={{ borderBottom: '2px solid #1A1D1E' }}>
              <div onClick={() => setShowProfileEdit(!showProfileEdit)} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <Edit3 size={20} />
                <span style={{ flex: 1, fontWeight: '600' }}>Setting Profil</span>
                <ChevronRight size={20} color="#999" style={{ transform: showProfileEdit ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
              
              {showProfileEdit && (
                <div style={{ padding: '0 16px 16px' }}>
                  <form onSubmit={handleUpdateProfile}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', display: 'block' }}>NAMA PROFILE</label>
                      <input 
                        type="text" 
                        value={profileName} 
                        onChange={e => setProfileName(e.target.value)} 
                        placeholder="Masukkan nama Anda" 
                        style={{ marginBottom: '8px' }}
                      />
                    </div>
                    <button type="submit" disabled={isUpdating} className="btn-pressed-blue" style={{
                      width: '100%', padding: '12px', background: '#1A1D1E', color: '#fff',
                      border: '2px solid #1A1D1E', borderRadius: '12px', fontWeight: '700',
                      boxShadow: '4px 4px 0px rgba(0,0,0,0.2)',
                      opacity: isUpdating ? 0.7 : 1, cursor: isUpdating ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                      {isUpdating ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
                      Simpan Profil
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
          {user && (
            <div style={{ borderBottom: '2px solid #1A1D1E' }}>
              <div 
                onClick={() => setShowShortcutInfo(!showShortcutInfo)} 
                style={{ 
                  padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                  background: showShortcutInfo ? '#FEF9C3' : 'transparent',
                  transition: 'background 0.2s ease'
                }}
              >
                <div style={{ width: '28px', height: '28px', background: '#D4F7E6', border: '2px solid #1A1D1E', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '700', fontSize: '14px', margin: 0, color: '#1A1D1E' }}>Integrasi iOS Shortcut</p>
                  <p style={{ fontSize: '11px', color: '#666', margin: 0 }}>Catat otomatis struk Mandiri, BRImo, SeaBank, DANA, ShopeePay</p>
                </div>
                <ChevronRight 
                  size={20} 
                  color="#999" 
                  style={{ transform: showShortcutInfo ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} 
                />
              </div>

              {showShortcutInfo && (
                <div style={{ padding: '16px', background: '#FAFAFA', borderTop: '2px solid #1A1D1E' }}>
                  {/* Mode Selector Tabs */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <button
                      type="button"
                      onClick={() => setShortcutMode('simple')}
                      style={{
                        flex: 1, padding: '8px 10px', borderRadius: '8px',
                        border: '2px solid #1A1D1E',
                        background: shortcutMode === 'simple' ? '#1A1D1E' : '#FFFFFF',
                        color: shortcutMode === 'simple' ? '#FFFFFF' : '#1A1D1E',
                        fontWeight: '800', fontSize: '12px', cursor: 'pointer',
                        boxShadow: shortcutMode === 'simple' ? 'none' : '2px 2px 0px #1A1D1E'
                      }}
                    >
                      ⚡ Mode Simpel (2 Aksi)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShortcutMode('advanced')}
                      style={{
                        flex: 1, padding: '8px 10px', borderRadius: '8px',
                        border: '2px solid #1A1D1E',
                        background: shortcutMode === 'advanced' ? '#1A1D1E' : '#FFFFFF',
                        color: shortcutMode === 'advanced' ? '#FFFFFF' : '#1A1D1E',
                        fontWeight: '800', fontSize: '12px', cursor: 'pointer',
                        boxShadow: shortcutMode === 'advanced' ? 'none' : '2px 2px 0px #1A1D1E'
                      }}
                    >
                      ⚙️ Mode Background API
                    </button>
                  </div>

                  {shortcutMode === 'simple' ? (
                    <div>
                      {/* Get Shortcut Button */}
                      <a
                        href={IOS_SHORTCUT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-pressed-blue"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          width: '100%', padding: '12px 16px', background: '#FEF08A', color: '#1A1D1E',
                          border: '2px solid #1A1D1E', borderRadius: '10px', fontWeight: '800',
                          fontSize: '13px', textDecoration: 'none', marginBottom: '14px',
                          boxShadow: '3px 3px 0px #1A1D1E'
                        }}
                      >
                        <Zap size={18} />
                        <span>Pasang Shortcut di iPhone (Get Shortcut)</span>
                        <ExternalLink size={15} />
                      </a>

                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '11px', fontWeight: '800', color: '#666' }}>
                            TARGET APLIKASI DI IPHONE
                          </label>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => setUrlType('pwa')}
                              style={{
                                padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800',
                                border: '1.5px solid #1A1D1E',
                                background: urlType === 'pwa' ? '#1A1D1E' : '#FFFFFF',
                                color: urlType === 'pwa' ? '#FFFFFF' : '#1A1D1E', cursor: 'pointer'
                              }}
                            >
                              📱 Layar Utama (PWA)
                            </button>
                            <button
                              type="button"
                              onClick={() => setUrlType('safari')}
                              style={{
                                padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800',
                                border: '1.5px solid #1A1D1E',
                                background: urlType === 'safari' ? '#1A1D1E' : '#FFFFFF',
                                color: urlType === 'safari' ? '#FFFFFF' : '#1A1D1E', cursor: 'pointer'
                              }}
                            >
                              🌐 Safari Web
                            </button>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            readOnly
                            value={shortcutUrlTemplate}
                            style={{
                              flex: 1, fontFamily: 'monospace', fontSize: '11px', padding: '10px 12px',
                              background: '#FFFFFF', border: '2px solid #1A1D1E', borderRadius: '8px'
                            }}
                          />
                          <button
                            type="button"
                            onClick={handleCopyUrl}
                            className="btn-pressed-blue"
                            style={{
                              padding: '10px 14px', background: copiedUrl ? '#D4F7E6' : '#FFFFFF',
                              border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700',
                              fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                          >
                            {copiedUrl ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                            <span>{copiedUrl ? 'Tersalin' : 'Salin'}</span>
                          </button>
                        </div>
                        {urlType === 'pwa' && (
                          <p style={{ fontSize: '10px', color: '#16A34A', fontWeight: '700', margin: '4px 0 0 2px' }}>
                            ✓ Menggunakan <code>webapp://</code> agar langsung membuka aplikasi di Layar Utama (Homescreen), bukan Safari biasa!
                          </p>
                        )}
                      </div>

                      {/* Panduan 2 Langkah */}
                      <div style={{
                        padding: '12px 14px', background: '#FFFFFF', border: '2px solid #1A1D1E',
                        borderRadius: '8px', fontSize: '12px', lineHeight: '1.6'
                      }}>
                        <p style={{ fontWeight: '800', marginBottom: '8px', color: '#1A1D1E' }}>
                          Hanya butuh 2 atau 3 aksi di Shortcuts iPhone:
                        </p>
                        <ol style={{ margin: 0, paddingLeft: '18px', color: '#333' }}>
                          <li style={{ marginBottom: '6px' }}>
                            Aksi 1: <strong>"Ekstrak Teks dari Gambar"</strong><br />
                            <span style={{ color: '#666', fontSize: '11px' }}>Input: Gambar dari Lembar Berbagi (Share Sheet)</span>
                          </li>
                          <li style={{ marginBottom: '6px' }}>
                            Aksi 2 (Opsional): <strong>"Tampilkan Pemberitahuan"</strong> (Notifikasi Sukses ✅)
                          </li>
                          <li style={{ marginBottom: '6px' }}>
                            Aksi 3: <strong>"Buka URL"</strong><br />
                            <span style={{ color: '#666', fontSize: '11px' }}>URL: <code>{shortcutUrlTemplate}[Teks]</code></span>
                            <div style={{ marginTop: '4px', padding: '4px 8px', background: '#EFF6FF', borderRadius: '4px', border: '1px solid #BFDBFE' }}>
                              <span style={{ color: '#1D4ED8', fontSize: '11px', fontWeight: '700' }}>
                                💡 Penting: Ketuk variabel <b>[Teks]</b> di dalam kolom URL, lalu pilih <b>"Pengodean URL (URL Encoded)"</b> agar teks multi-baris struk tidak terpotong!
                              </span>
                            </div>
                          </li>
                        </ol>
                        <div style={{ marginTop: '10px', padding: '10px', background: '#D4F7E6', borderRadius: '6px', border: '1px solid #1A1D1E' }}>
                          <p style={{ fontSize: '11px', fontWeight: '800', color: '#1A1D1E', margin: '0 0 4px 0' }}>
                            ✨ Alur Penggunaan:
                          </p>
                          <p style={{ fontSize: '11px', color: '#333', margin: 0 }}>
                            Bagikan struk dari Mandiri, BRImo, SeaBank, DANA, atau ShopeePay ke Shortcut. myWallet langsung terbuka di layar utama dengan nominal, nama toko/merchant, kategori, dan dompet yang terisi otomatis. Anda tinggal tap <strong>"Simpan Transaksi"</strong>!
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#666', marginBottom: '6px', display: 'block' }}>
                          KUNCI API PRIBADI (PERSONAL API KEY)
                        </label>

                        {shortcutApiKey ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="text"
                              readOnly
                              value={shortcutApiKey}
                              style={{
                                flex: 1, fontFamily: 'monospace', fontSize: '12px', padding: '10px 12px',
                                background: '#FFFFFF', border: '2px solid #1A1D1E', borderRadius: '8px'
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleCopyKey}
                              className="btn-pressed-blue"
                              style={{
                                padding: '10px 14px', background: copiedKey ? '#D4F7E6' : '#FFFFFF',
                                border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700',
                                fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                              }}
                            >
                              {copiedKey ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                              <span>{copiedKey ? 'Tersalin' : 'Salin'}</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleGenerateApiKey}
                            disabled={isGeneratingKey}
                            className="btn-pressed-blue"
                            style={{
                              width: '100%', padding: '12px', background: '#D4F7E6', border: '2px solid #1A1D1E',
                              borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: isGeneratingKey ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                          >
                            {isGeneratingKey ? <LoaderCircle size={16} className="animate-spin" /> : <Key size={16} />}
                            <span>Buat Kunci API iOS Shortcut</span>
                          </button>
                        )}

                        {shortcutApiKey && (
                          <div style={{ marginTop: '6px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={handleGenerateApiKey}
                              disabled={isGeneratingKey}
                              style={{
                                background: 'none', border: 'none', color: '#666', fontSize: '11px',
                                textDecoration: 'underline', cursor: 'pointer'
                              }}
                            >
                              {isGeneratingKey ? 'Membuat...' : 'Buat Ulang Kunci (Regenerate)'}
                            </button>
                          </div>
                        )}
                      </div>

                      <div style={{
                        padding: '12px 14px', background: '#FFFFFF', border: '2px solid #1A1D1E',
                        borderRadius: '8px', fontSize: '12px', lineHeight: '1.6'
                      }}>
                        <p style={{ fontWeight: '800', marginBottom: '8px', color: '#1A1D1E' }}>
                          Webhook API Transaksi Otomatis:
                        </p>
                        <p style={{ fontSize: '11px', color: '#555', margin: '0 0 8px 0' }}>
                          Endpoint POST: <code>{`${window.location.origin}/api/quick-transaction`}</code><br />
                          Header: <code>Authorization: Bearer [API_KEY]</code>
                        </p>
                        <div style={{ padding: '8px 10px', background: '#FEF9C3', borderRadius: '6px', border: '1px solid #1A1D1E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Info size={16} color="#1A1D1E" />
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#1A1D1E' }}>
                            Opsi ini mencatat transaksi di background tanpa membuka browser, menggunakan pop-up alert native iOS Shortcuts.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {user && (
            <div onClick={() => {
              if (window.confirm('Hapus data lokal yang error? Data server aman.')) {
                localStorage.clear();
                window.location.reload();
              }
            }} style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#EF4444' }}>
              <Trash2 size={20} />
              <span style={{ flex: 1, fontWeight: '600' }}>Reset Data Lokal</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AccountTab;
