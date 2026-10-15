import React from 'react';
import { Home, PiggyBank, Plus, AlertCircle, User } from 'lucide-react';
import { useDebt } from '../../context/DebtContext';

const BottomNav = ({ activeTab, onTabChange, onAddClick }) => {
  const { totalOwed } = useDebt();
  const hasDebt = totalOwed > 0;

  return (
    <nav className="bottom-nav">
      <button className={activeTab === 'home' ? 'active' : ''} onClick={() => onTabChange('home')}>
        <Home size={24} />
      </button>
      <button
        className={activeTab === 'debt' ? 'active' : ''}
        onClick={() => onTabChange('debt')}
        style={{ position: 'relative' }}
      >
        <AlertCircle size={24} />
        {hasDebt && (
          <span style={{
            position: 'absolute', top: '4px', right: '4px',
            width: '8px', height: '8px', background: '#EF4444',
            borderRadius: '50%', border: '1.5px solid #fff'
          }} />
        )}
      </button>
      <button className="bottom-nav-add" onClick={onAddClick}>
        <Plus size={28} />
      </button>
      <button className={activeTab === 'savings' ? 'active' : ''} onClick={() => onTabChange('savings')}>
        <PiggyBank size={24} />
      </button>
      <button className={activeTab === 'account' || activeTab === 'categories' || activeTab === 'wallet' ? 'active' : ''} onClick={() => onTabChange('account')}>
        <User size={24} />
      </button>
    </nav>
  );
};

export default BottomNav;
