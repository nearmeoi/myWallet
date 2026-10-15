import React from 'react';
import { Trash2, Edit3, ArrowLeftRight } from 'lucide-react';

const TransactionCard = ({ transaction, category, onDelete, onEdit }) => {
    const { title, amount, type, date } = transaction;
    const isIncome = type === 'income';
    const isTransfer = transaction.category === 'transfer';

    // Check if category is valid, otherwise fallback
    const validCategory = category || { label: 'Lainnya', color: '#1A1D1E', bg: '#F3F4F6' };
    const IconComponent = isTransfer ? ArrowLeftRight : validCategory.icon;
    const iconBg = isTransfer ? '#E0CCF8' : validCategory.bg;

    return (
        <div className="card" style={{
            marginBottom: '12px', padding: '16px',
            display: 'flex', alignItems: 'center', gap: '16px',
            border: '2px solid #1A1D1E', borderRadius: '12px',
            boxShadow: '4px 4px 0px #1A1D1E',
            background: '#FFFFFF',
            position: 'relative'
        }}>
            {/* Category Icon Box */}
            <div style={{
                width: '48px', height: '48px',
                border: '2px solid #1A1D1E', borderRadius: '8px',
                background: iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
            }}>
                {IconComponent && <IconComponent size={24} color="#1A1D1E" />}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{
                    fontSize: '16px', fontWeight: '800', marginBottom: '2px', color: '#1A1D1E',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                    {title}
                </h4>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#666' }}>
                    {date} {transaction.walletName ? `• ${transaction.walletName}` : ''}
                </p>
            </div>

            {/* Amount */}
            <div style={{ textAlign: 'right' }}>
                <p style={{
                    fontSize: '16px', fontWeight: '900',
                    color: isTransfer ? '#7C3AED' : (isIncome ? '#16A34A' : '#1A1D1E'),
                    marginBottom: '4px'
                }}>
                    {isTransfer ? '⇄ ' : (isIncome ? '+' : '-')}{Math.abs(amount).toLocaleString('id-ID')}
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <Edit3 size={16} color="#1A1D1E" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <Trash2 size={16} color="#FF5555" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransactionCard;
