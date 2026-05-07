import React from 'react';
import { Loader2, AlertCircle, PackageOpen, ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Button ───────────────────────────────────────────────────────────────────
export const Button = ({
  children, onClick, type = 'button', variant = 'primary',
  size = 'md', disabled = false, loading = false, className = '', icon: Icon,
}) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary:   'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500',
    danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost:     'text-gray-600 hover:bg-gray-100 focus:ring-gray-400',
    success:   'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = ({ children, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${className}`}>
    {children}
  </span>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 24, className = '' }) => (
  <Loader2 size={size} className={`animate-spin text-indigo-600 ${className}`} />
);

export const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Spinner size={40} />
  </div>
);

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '', padding = true }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${padding ? 'p-6' : ''} ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ title, subtitle, actions }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

// ─── KPI Stat Card ────────────────────────────────────────────────────────────
export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'indigo', trend }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-green-50 text-green-600',
    red:    'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    blue:   'bg-blue-50 text-blue-600',
  };
  return (
    <Card className="flex items-center gap-4">
      {Icon && (
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={22} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 truncate">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </Card>
  );
};

// ─── Alert / Error banner ─────────────────────────────────────────────────────
export const Alert = ({ message, type = 'error' }) => {
  if (!message) return null;
  const styles = {
    error:   'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info:    'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
  };
  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${styles[type]}`}>
      <AlertCircle size={16} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
};

// ─── Table ────────────────────────────────────────────────────────────────────
export const Table = ({ columns, data, loading, emptyMessage = 'No records found' }) => {
  if (loading) return <PageLoader />;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col.key}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {(!data || data.length === 0) ? (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center">
                <PackageOpen size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// ─── Pagination ───────────────────────────────────────────────────────────────
export const Pagination = ({ page, totalPages, total, limit, onPage }) => {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" icon={ChevronLeft}
          disabled={page <= 1} onClick={() => onPage(page - 1)} />
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = i + 1;
          return (
            <button key={p} onClick={() => onPage(p)}
              className={`w-8 h-8 text-sm rounded-lg ${p === page
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'}`}>
              {p}
            </button>
          );
        })}
        <Button variant="ghost" size="sm" icon={ChevronRight}
          disabled={page >= totalPages} onClick={() => onPage(page + 1)} />
      </div>
    </div>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full mx-4 ${sizes[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">{children}</div>
      </div>
    </div>
  );
};

// ─── Input ────────────────────────────────────────────────────────────────────
export const Input = ({ label, error, required, className = '', ...props }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <input
      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all
        ${error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

// ─── Select ───────────────────────────────────────────────────────────────────
export const Select = ({ label, error, required, children, className = '', ...props }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <select
      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
        ${error ? 'border-red-400' : 'border-gray-300'} bg-white`}
      {...props}
    >
      {children}
    </select>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

// ─── Search bar ───────────────────────────────────────────────────────────────
export const SearchBar = ({ value, onChange, placeholder = 'Search…' }) => (
  <div className="relative">
    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
    <input
      type="text" value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
    />
  </div>
);
