import React from 'react';
import { Cloud, LoaderCircle, Settings } from 'lucide-react';

const Header = ({ user, syncing, onSettingsClick }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Pagi';
    if (hour < 15) return 'Siang';
    if (hour < 18) return 'Sore';
    return 'Malam';
  };

  const username = user ? (user.user_metadata?.username || user.email.split('@')[0]) : 'Tamu';
  const greeting = getGreeting();

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={onSettingsClick}
          className="btn-pressed-blue"
          style={{
            width: '40px', height: '40px', borderRadius: '50%', background: user ? '#D4F7E6' : '#FEF08A',
            border: '2px solid #1A1D1E', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, cursor: 'pointer'
          }}
        >
          <span style={{ fontWeight: '700' }}>{user ? user.email[0].toUpperCase() : 'G'}</span>
        </button>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            {greeting}, {username}
          </h1>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#666', marginTop: '2px' }}>
              {syncing ? <LoaderCircle size={10} className="animate-spin" /> : <Cloud size={10} />}
              <span>{syncing ? 'Syncing...' : 'Synced'}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#666', marginTop: '2px' }}>
              <span>Mode Lokal (Offline)</span>
            </div>
          )}
        </div>
      </div>
      <button 
        onClick={onSettingsClick} 
        className="btn-pressed-blue"
        style={{
          width: '40px', height: '40px', borderRadius: '12px', background: '#FFFFFF',
          border: '2px solid #1A1D1E', boxShadow: '2px 2px 0px #1A1D1E',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <Settings size={20} />
      </button>
    </header>
  );
};

export default Header;
