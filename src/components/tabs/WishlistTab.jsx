import React from 'react';
import { Plus, ShoppingBag, Check, Trash2 } from 'lucide-react';
import { formatRupiah } from '../../lib/utils';

const WishlistTab = ({ 
  wishlist, 
  balance, 
  wishlistTotal, 
  onOpenModal, 
  onMarkPurchased, 
  onDelete 
}) => {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '900' }}>Wishlist.</h2>
        <button onClick={() => onOpenModal('wishlist')} style={{
          width: '44px', height: '44px', background: '#E0CCF8', border: '2px solid #1A1D1E',
          borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '4px 4px 0px #1A1D1E', color: '#1A1D1E', cursor: 'pointer'
        }}>
          <Plus size={24} color="#1A1D1E" />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div className="card" style={{ flex: 1, padding: '16px', margin: 0 }}>
          <p style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>TARGET</p>
          <p style={{ fontSize: '18px', fontWeight: '900' }}>{formatRupiah(wishlistTotal)}</p>
        </div>
        <div className="card" style={{ flex: 1, padding: '16px', margin: 0, background: '#FEF9C3' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>SISA</p>
          <p style={{ fontSize: '18px', fontWeight: '900' }}>{formatRupiah(balance - wishlistTotal)}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {wishlist.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ fontWeight: '700' }}>Belum ada keinginan.</p>
          </div>
        ) : (
          wishlist.map(item => (
            <div key={item.id} className="card" style={{ padding: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', border: '2px solid #1A1D1E', borderRadius: '8px', background: '#E0CCF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800' }}>{item.name}</h3>
                <p style={{ fontSize: '14px', fontWeight: '600' }}>{formatRupiah(item.price)}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => onMarkPurchased(item)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <div style={{ padding: '8px', border: '2px solid #1A1D1E', borderRadius: '6px', background: '#D4F7E6', boxShadow: '2px 2px 0px #1A1D1E' }}>
                    <Check size={16} />
                  </div>
                </button>
                <button onClick={() => onDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <div style={{ padding: '8px', border: '2px solid #1A1D1E', borderRadius: '6px', background: '#FFC0C0', boxShadow: '2px 2px 0px #1A1D1E' }}>
                    <Trash2 size={16} />
                  </div>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default WishlistTab;
