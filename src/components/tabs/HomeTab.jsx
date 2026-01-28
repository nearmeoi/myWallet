import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, MoreHorizontal, ArrowLeftRight, Search, Filter } from 'lucide-react';
import TransactionCard from '../TransactionCard';
import { AVAILABLE_ICONS } from '../../lib/constants';
import { formatDate, formatRupiah } from '../../lib/utils';

const HomeTab = ({ 

  balance, 

  transactions, 

  categories, 

  wallets, 

  onOpenModal, 

  onDelete, 

  onEdit 

}) => {

  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const [filterType, setFilterType] = useState('all');

  const [searchQuery, setSearchQuery] = useState('');

  const [selectedWallet, setSelectedWallet] = useState('all');

  const [showFilters, setShowFilters] = useState(false);

  

  // Date Filter State

  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  const [selectedYear, setSelectedYear] = useState(now.getFullYear());



  const getCategoryById = (id) => categories.find(c => c.id === id) || { name: 'Lainnya', icon: 'MoreHorizontal', bg: '#F3F4F6' };



    const filteredTransactions = transactions.filter(t => {



      const tDate = new Date(t.timestamp);



      const matchesType = filterType === 'all' || t.type === filterType;



      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());



      const matchesWallet = selectedWallet === 'all' || t.walletId?.toString() === selectedWallet.toString();



      const matchesDate = tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;



      



      // Logic to show only 1 entry for transfers in "All Wallets" view



      const isTransferIncome = selectedWallet === 'all' && t.category === 'transfer' && t.type === 'income';



      



      return matchesType && matchesSearch && matchesWallet && matchesDate && !isTransferIncome;



    });



  



  const visibleTransactions = showAllTransactions ? filteredTransactions : filteredTransactions.slice(0, 5);



  // Group transactions by date

  const groupedTransactions = visibleTransactions.reduce((groups, tx) => {

    const date = new Date(tx.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    if (!groups[date]) {

      groups[date] = [];

    }

    groups[date].push(tx);

    return groups;

  }, {});



  const months = [

    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',

    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'

  ];



  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);



  return (

    <>

      <section className="card" style={{ background: '#BBEFFA', position: 'relative', overflow: 'hidden' }}>

        <div style={{ position: 'relative', zIndex: 1 }}>

          <p style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Saldo.</p>

          <h2 style={{ fontSize: '40px', fontWeight: '900', marginBottom: '24px', lineHeight: '1' }}>

            {formatRupiah(balance)}

          </h2>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>

                      <button onClick={() => onOpenModal('transaction', 'income')} className="btn-pressed-blue" style={{

                        flex: 1, minWidth: '100px', padding: '12px 8px', background: '#1A1D1E', color: '#fff',

                        border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700',

                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '13px',

                        boxShadow: '3px 3px 0px rgba(0,0,0,0.2)'

                      }}>

                        <ArrowDownLeft size={16} /> Masuk

                      </button>

                      <button onClick={() => onOpenModal('transaction', 'expense')} className="btn-pressed-blue" style={{

                        flex: 1, minWidth: '100px', padding: '12px 8px', background: '#FFFFFF', color: '#1A1D1E',

                        border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700',

                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '13px',

                        boxShadow: '3px 3px 0px #1A1D1E'

                      }}>

                        <ArrowUpRight size={16} /> Keluar

                      </button>

                      <button onClick={() => onOpenModal('transfer')} className="btn-pressed-blue" style={{

                        flex: '1 1 100%', padding: '10px', background: '#E0CCF8', color: '#1A1D1E',

                        border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700',

                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px',

                        boxShadow: '3px 3px 0px #1A1D1E', marginTop: '4px'

                      }}>

                        <ArrowLeftRight size={16} /> Transfer Antar Dompet

                      </button>

                    </div>

        </div>

        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: '#FEF08A', borderRadius: '50%', border: '2px solid #1A1D1E', zIndex: 0 }} />

      </section>



      {/* Search & Filter Bar */}

      <div style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>

                <div style={{ flex: 1, position: 'relative' }}>

                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-55%)', color: '#999' }} />

                  <input 

         

            type="text" 

            placeholder="Cari transaksi..." 

            value={searchQuery}

            onChange={(e) => setSearchQuery(e.target.value)}

            style={{ 

              width: '100%', padding: '10px 10px 10px 40px', borderRadius: '12px', 

              border: '2px solid #1A1D1E', fontSize: '14px', fontWeight: '600' 

            }}

          />

        </div>

        <button 

          onClick={() => setShowFilters(!showFilters)}

          style={{ 

            padding: '10px', borderRadius: '12px', border: '2px solid #1A1D1E', 

            background: showFilters ? '#1A1D1E' : '#FFFFFF', color: showFilters ? '#FFFFFF' : '#1A1D1E',

            display: 'flex', alignItems: 'center', justifyContent: 'center'

          }}

        >

          <Filter size={20} />

        </button>

      </div>



      {showFilters && (

        <div className="card animate-slide-up" style={{ marginTop: '12px', padding: '16px', background: '#F3F4F6', border: '2px solid #1A1D1E' }}>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>

            <div style={{ flex: 1 }}>

              <label style={{ fontSize: '10px', fontWeight: '800', marginBottom: '4px', display: 'block' }}>BULAN</label>

              <select 

                value={selectedMonth} 

                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}

                style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #1A1D1E', fontWeight: '700', fontSize: '12px' }}

              >

                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}

              </select>

            </div>

            <div style={{ flex: 1 }}>

              <label style={{ fontSize: '10px', fontWeight: '800', marginBottom: '4px', display: 'block' }}>TAHUN</label>

              <select 

                value={selectedYear} 

                onChange={(e) => setSelectedYear(parseInt(e.target.value))}

                style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #1A1D1E', fontWeight: '700', fontSize: '12px' }}

              >

                {years.map(y => <option key={y} value={y}>{y}</option>)}

              </select>

            </div>

          </div>



          <div style={{ marginBottom: '12px' }}>

            <label style={{ fontSize: '10px', fontWeight: '800', marginBottom: '4px', display: 'block' }}>FILTER DOMPET</label>

            <select 

              value={selectedWallet} 

              onChange={(e) => setSelectedWallet(e.target.value)}

              style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #1A1D1E', fontWeight: '700', fontSize: '12px' }}

            >

              <option value="all">Semua Dompet</option>

              {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}

            </select>

          </div>

          <div>

            <label style={{ fontSize: '10px', fontWeight: '800', marginBottom: '4px', display: 'block' }}>TIPE</label>

            <div style={{ display: 'flex', gap: '8px' }}>

              {['all', 'income', 'expense'].map(type => (

                <button key={type} onClick={() => setFilterType(type)} style={{

                  flex: 1, padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',

                  background: filterType === type ? '#1A1D1E' : '#FFFFFF',

                  color: filterType === type ? '#FFFFFF' : '#1A1D1E',

                  border: '1px solid #1A1D1E'

                }}>

                  {type === 'all' ? 'Semua' : (type === 'income' ? 'Masuk' : 'Keluar')}

                </button>

              ))}

            </div>

          </div>

        </div>

      )}



      <div style={{ marginTop: '24px', marginBottom: '16px' }}>

        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>

          Riwayat <span className="highlight-text">Transaksi</span>.

        </h3>

      </div>



      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {Object.keys(groupedTransactions).length === 0 ? (

          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', background: '#F3F4F6' }}>

            <p style={{ fontWeight: '600' }}>Kosong!</p>

            <p style={{ fontSize: '13px' }}>Tidak ada transaksi di periode ini.</p>

          </div>

        ) : (

          Object.keys(groupedTransactions).map(date => (

            <div key={date}>

              <p style={{ fontSize: '12px', fontWeight: '800', color: '#666', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{date}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {groupedTransactions[date].map(tx => {

                  const cat = getCategoryById(tx.category);

                  const IconComp = AVAILABLE_ICONS[cat.icon] || MoreHorizontal;

                  const wallet = wallets.find(w => w.id?.toString() === tx.walletId?.toString());

                  const walletName = wallet ? wallet.name : '';



                  return (

                    <div key={tx.id} className="animate-slide-up">

                      <TransactionCard

                        transaction={{ ...tx, date: formatDate(tx.timestamp), walletName }}

                        category={{ ...cat, icon: IconComp }}

                        onEdit={() => onEdit(tx)}

                        onDelete={() => onDelete(tx.id)}

                      />

                    </div>

                  );

                })}

              </div>

            </div>

          ))

        )}

      </div>



      {filteredTransactions.length > 5 && (
        <button onClick={() => setShowAllTransactions(!showAllTransactions)} style={{
          width: '100%', padding: '12px', marginTop: '16px', background: '#FFFFFF',
          border: '2px solid #1A1D1E', borderRadius: '8px', fontWeight: '700',
          boxShadow: '3px 3px 0px #1A1D1E'
        }}>
          {showAllTransactions ? 'Sembunyikan' : 'Lihat Semua'}
        </button>
      )}
    </>
  );
};

export default HomeTab;
