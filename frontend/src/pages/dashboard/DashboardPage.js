import React from 'react';
import { useApi } from '../../hooks/useApi';
import { reportAPI } from '../../api';
import { StatCard, Card, CardHeader, Badge, PageLoader, Alert } from '../../components/ui';
import { formatCurrency, formatDateTime, statusColor } from '../../utils/helpers';
import {
  DollarSign, AlertTriangle, ClipboardList,
  ShoppingCart, Package, Truck,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

const TXN_COLORS = {
  IN: '#22c55e', OUT: '#ef4444', TRANSFER_IN: '#3b82f6',
  TRANSFER_OUT: '#f97316', ADJUSTMENT: '#a855f7',
};

export default function DashboardPage() {
  const { data, loading, error } = useApi(reportAPI.getDashboard, [], []);

  if (loading) return <PageLoader />;
  if (error)   return <Alert message={error} />;

  const kpis = data?.kpis || {};
  const txns = data?.recent_transactions || [];

  // Build txn-type chart data from recent transactions
  const txnTypes = txns.reduce((acc, t) => {
    acc[t.txn_type] = (acc[t.txn_type] || 0) + t.quantity;
    return acc;
  }, {});
  const chartData = Object.entries(txnTypes).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time inventory overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard title="Total Inventory Value"
          value={formatCurrency(kpis.total_inventory_value)}
          icon={DollarSign} color="indigo" />
        <StatCard title="Low Stock Alerts"
          value={kpis.low_stock_items}
          subtitle="Items below reorder level"
          icon={AlertTriangle} color="red" />
        <StatCard title="Pending Purchase Orders"
          value={kpis.pending_purchase_orders}
          icon={ClipboardList} color="yellow" />
        <StatCard title="Active Sales Orders"
          value={kpis.active_customer_orders}
          icon={ShoppingCart} color="blue" />
        <StatCard title="Active Products"
          value={kpis.total_active_products}
          icon={Package} color="green" />
        <StatCard title="Active Suppliers"
          value={kpis.total_active_suppliers}
          icon={Truck} color="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="xl:col-span-2" padding={false}>
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  {['Product','Warehouse','Type','Qty','Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {txns.map((t) => (
                  <tr key={t.txn_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.product_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{t.warehouse_name}</td>
                    <td className="px-4 py-3">
                      <Badge className={statusColor(t.txn_type)}>{t.txn_type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono">{t.quantity}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(t.txn_date)}</td>
                  </tr>
                ))}
                {txns.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-400 text-sm">No transactions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pie chart */}
        <Card>
          <CardHeader title="Transaction Mix" subtitle="By type (recent)" />
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name }) => name}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={TXN_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 text-sm py-12">No data</p>
          )}
        </Card>
      </div>
    </div>
  );
}
