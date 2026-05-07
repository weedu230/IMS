/** Format a number as PKR currency */
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 })
    .format(amount || 0);

/** Format a date string to readable form */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-PK', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

/** Format a datetime string */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-PK', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

/** Status badge colour mapping */
export const statusColor = (status) => {
  const map = {
    // PO
    draft:              'bg-gray-100 text-gray-700',
    pending_approval:   'bg-yellow-100 text-yellow-800',
    approved:           'bg-blue-100 text-blue-800',
    sent:               'bg-indigo-100 text-indigo-800',
    partially_received: 'bg-orange-100 text-orange-800',
    received:           'bg-green-100 text-green-800',
    // Order
    pending:            'bg-gray-100 text-gray-700',
    confirmed:          'bg-blue-100 text-blue-800',
    picking:            'bg-yellow-100 text-yellow-800',
    packed:             'bg-indigo-100 text-indigo-800',
    dispatched:         'bg-purple-100 text-purple-800',
    fulfilled:          'bg-green-100 text-green-800',
    cancelled:          'bg-red-100 text-red-800',
    returned:           'bg-pink-100 text-pink-800',
    // TXN
    IN:                 'bg-green-100 text-green-800',
    OUT:                'bg-red-100 text-red-800',
    TRANSFER_IN:        'bg-blue-100 text-blue-800',
    TRANSFER_OUT:       'bg-orange-100 text-orange-800',
    ADJUSTMENT:         'bg-purple-100 text-purple-800',
    RETURN:             'bg-pink-100 text-pink-800',
    WRITE_OFF:          'bg-gray-100 text-gray-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};

/** Extract API error message from Axios error */
export const getErrorMessage = (err) =>
  err?.response?.data?.message || err?.message || 'Something went wrong';
