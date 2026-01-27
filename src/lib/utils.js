export const formatDate = (dateInput) => {
  const now = new Date();
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput;
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isToday) return `Hari ini, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  if (date.toDateString() === yesterday.toDateString()) return `Kemarin, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + `, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
};

export const formatRupiah = (num) => 'Rp ' + Math.abs(num).toLocaleString('id-ID');

export const formatNumberInput = (num) => {
  if (num === '' || num === null || num === undefined) return '';
  const clean = num.toString().replace(/\D/g, '');
  if (!clean) return '';
  return parseInt(clean).toLocaleString('id-ID');
};
