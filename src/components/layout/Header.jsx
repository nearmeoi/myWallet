import React from 'react';
import { Cloud, LoaderCircle, Settings } from 'lucide-react';

const Header = ({ user, syncing, onSettingsClick }) => {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%', background: user ? '#D4F7E6' : '#FEF08A',
          border: '2px solid #1A1D1E', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{ fontWeight: '700' }}>{user ? user.email[0].toUpperCase() : 'G'}</span>
        </div>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: 1 }}>
            Wallet<span style={{ color: '#BBEFFA' }}>.</span>
          </h1>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#666' }}>
              {syncing ? <LoaderCircle size={10} className="animate-spin" /> : <Cloud size={10} />}
              <span>{syncing ? 'Syncing...' : 'Synced'}</span>
            </div>
          )}
        </div>
      </div>
      <button onClick={onSettingsClick} style={{
        width: '40px', height: '40px', borderRadius: '12px', background: '#FFFFFF',
        border: '2px solid #1A1D1E', boxShadow: '2px 2px 0px #1A1D1E',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
      }}>
        <Settings size={20} />
      </button>
    </header>
  );
};

export default Header;
