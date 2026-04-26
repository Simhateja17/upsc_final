'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/lib/services';

interface Tab {
  id: string;
  label: string;
}

const tabs: Tab[] = [
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'orders', label: 'Orders' },
  { id: 'payments', label: 'Payments' },
];

export default function AdminBillingPage() {
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'subscriptions') {
        res = await adminService.getAdminSubscriptions({ page, limit });
        setData(res.data?.subscriptions || []);
        setTotal(res.data?.total || 0);
      } else if (activeTab === 'orders') {
        res = await adminService.getAdminOrders({ page, limit });
        setData(res.data?.orders || []);
        setTotal(res.data?.total || 0);
      } else {
        res = await adminService.getAdminPayments({ page, limit });
        setData(res.data?.payments || []);
        setTotal(res.data?.total || 0);
      }
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page]);

  const handleExtend = async (id: string) => {
    const days = prompt('Enter number of days to extend:');
    if (!days || isNaN(Number(days))) return;
    try {
      await adminService.extendSubscription(id, parseInt(days));
      setMsg(`Subscription extended by ${days} days`);
      load();
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-[clamp(1.5rem,2vw,2rem)]">
        <h1 className="font-inter font-bold text-[#111827]" style={{ fontSize: 'clamp(22px, 1.6vw, 30px)' }}>
          Billing & Subscriptions
        </h1>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm font-inter" style={{
          background: msg.startsWith('Error') ? '#FEF2F2' : '#ECFDF5',
          color: msg.startsWith('Error') ? '#991B1B' : '#065F46',
          border: `1px solid ${msg.startsWith('Error') ? '#FECACA' : '#A7F3D0'}`,
        }}>
          {msg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[#E5E7EB]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#6366F1] text-[#6366F1]'
                : 'border-transparent text-[#6B7280] hover:text-[#374151]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid #E5E7EB' }}>
        {loading ? (
          <p className="text-sm text-[#6B7280] py-8 text-center">Loading...</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-[#6B7280] py-8 text-center">No {activeTab} found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    {activeTab === 'subscriptions' && (
                      <>
                        <th className="text-left py-3 px-2 text-[#6B7280] font-medium">User</th>
                        <th className="text-left py-3 px-2 text-[#6B7280] font-medium">Plan</th>
                        <th className="text-left py-3 px-2 text-[#6B7280] font-medium">Status</th>
                        <th className="text-left py-3 px-2 text-[#6B7280] font-medium">Start</th>
                        <th className="text-left py-3 px-2 text-[#6B7280] font-medium">End</th>
                        <th className="text-left py-3 px-2 text-[#6B7280] font-medium">Auto Renew</th>
                        <th className="text-left py-3 px-2 text-[#6B7280] font-medium">Actions</th>
                      </>
                    )}
                    {activeTab === 'orders' && (
                      <>
                        <th className="text-left py-3 px-2 text-[#6B7280] font-medium">User</th>
                        <th className="text-left py-3 px-2 text-[#6B7280] font-medium">Plan</th>
                        <th className="text-left py-3 px-2 text-[#6B7280] font-medium">Amount</th>
                        <th className="text-left py-3 px-2 text-[#6B7280] font-medium">Status</th>
                        <th className="text-left py-3 px-2 text-[#6B7280] font-medium">Date</th>
                      </>
                    )}
                    {activeTab === 'payments' && (
                      <>
                        <th className="text-left py-3 px-2 text-[#6B7280] font-medium">User</th>
                        <th className="text-left py-3 px-2 text-[#6B7280] font-medium">Amount</th>
                        <th className="text-left py-3 px-2 text-[#6B7280] font-medium">Status</th>
                        <th className="text-left py-3 px-2 text-[#6B7280] font-medium">Provider</th>
                        <th className="text-left py-3 px-2 text-[#6B7280] font-medium">Date</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item: any) => (
                    <tr key={item.id} className="border-b border-[#F3F4F6]">
                      {activeTab === 'subscriptions' && (
                        <>
                          <td className="py-3 px-2 text-[#111827]">
                            {item.user?.firstName || ''} {item.user?.lastName || ''}
                            <div className="text-xs text-[#6B7280]">{item.user?.email}</div>
                          </td>
                          <td className="py-3 px-2 text-[#111827]">{item.plan?.name}</td>
                          <td className="py-3 px-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.status === 'active' ? 'bg-[#ECFDF5] text-[#065F46]' :
                              item.status === 'cancelled' ? 'bg-[#FEF2F2] text-[#991B1B]' :
                              'bg-[#F3F4F6] text-[#6B7280]'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-[#374151]">{formatDate(item.startDate)}</td>
                          <td className="py-3 px-2 text-[#374151]">{formatDate(item.endDate)}</td>
                          <td className="py-3 px-2 text-[#374151]">{item.autoRenew ? 'Yes' : 'No'}</td>
                          <td className="py-3 px-2">
                            <button
                              onClick={() => handleExtend(item.id)}
                              className="text-xs px-2 py-1 rounded text-[#6366F1] hover:bg-[#EFF6FF]"
                            >
                              Extend
                            </button>
                          </td>
                        </>
                      )}
                      {activeTab === 'orders' && (
                        <>
                          <td className="py-3 px-2 text-[#111827]">
                            {item.user?.firstName || ''} {item.user?.lastName || ''}
                            <div className="text-xs text-[#6B7280]">{item.user?.email}</div>
                          </td>
                          <td className="py-3 px-2 text-[#111827]">{item.plan?.name}</td>
                          <td className="py-3 px-2 text-[#111827] font-semibold">₹{item.amount?.toLocaleString()}</td>
                          <td className="py-3 px-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.status === 'completed' ? 'bg-[#ECFDF5] text-[#065F46]' :
                              item.status === 'pending' ? 'bg-[#FFFBEB] text-[#92400E]' :
                              item.status === 'failed' ? 'bg-[#FEF2F2] text-[#991B1B]' :
                              'bg-[#F3F4F6] text-[#6B7280]'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-[#374151]">{formatDate(item.createdAt)}</td>
                        </>
                      )}
                      {activeTab === 'payments' && (
                        <>
                          <td className="py-3 px-2 text-[#111827]">
                            {item.user?.firstName || ''} {item.user?.lastName || ''}
                            <div className="text-xs text-[#6B7280]">{item.user?.email}</div>
                          </td>
                          <td className="py-3 px-2 text-[#111827] font-semibold">₹{item.amount?.toLocaleString()}</td>
                          <td className="py-3 px-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.status === 'success' ? 'bg-[#ECFDF5] text-[#065F46]' :
                              item.status === 'pending' ? 'bg-[#FFFBEB] text-[#92400E]' :
                              item.status === 'failed' ? 'bg-[#FEF2F2] text-[#991B1B]' :
                              'bg-[#F3F4F6] text-[#6B7280]'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-[#374151] capitalize">{item.provider}</td>
                          <td className="py-3 px-2 text-[#374151]">{formatDate(item.createdAt)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-[#6B7280]">
                  Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
