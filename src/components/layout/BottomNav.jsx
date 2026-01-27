import React from 'react';
import { Home, ShoppingBag, Plus, PieChart, User } from 'lucide-react';

const BottomNav = ({ activeTab, onTabChange, onAddClick }) => {
  return (
    <nav className="bottom-nav">
      <button className={activeTab === 'home' ? 'active' : ''} onClick={() => onTabChange('home')}>
        <Home size={24} />
      </button>
      <button className={activeTab === 'wishlist' ? 'active' : ''} onClick={() => onTabChange('wishlist')}>
        <ShoppingBag size={24} />
      </button>
      <button className="bottom-nav-add" onClick={onAddClick}>
        <Plus size={28} />
      </button>
      <button className={activeTab === 'wallet' ? 'active' : ''} onClick={() => onTabChange('wallet')}>
        <PieChart size={24} />
      </button>
      <button className={activeTab === 'account' ? 'active' : ''} onClick={() => onTabChange('account')}>
        <User size={24} />
      </button>
    </nav>
  );
};

export default BottomNav;
