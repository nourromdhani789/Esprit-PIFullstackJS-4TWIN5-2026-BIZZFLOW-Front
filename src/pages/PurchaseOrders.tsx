import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { purchaseOrderService, PurchaseOrder, CreatePurchaseOrderDto } from '../services/purchase-order.service';
import { supplierService, Supplier } from '../services/supplier.service';
import PageMeta from '../components/common/PageMeta';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import Button from '../components/ui/button/Button';
import Label from '../components/form/Label';
import Input from '../components/form/input/InputField';
import { Modal } from '../components/ui/modal';

export default function PurchaseOrders() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState<CreatePurchaseOrderDto>({
    supplierId: '',
    totalAmount: 0,
    notes: '',
  });

  // Check for supplierId in URL and pre-select if present
  useEffect(() => {
    const supplierId = searchParams.get('supplierId');
    if (supplierId) {
      setFormData(prev => ({ ...prev, supplierId }));
      setShowModal(true);
    }
  }, [searchParams]);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await purchaseOrderService.getAll();
      setOrders(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch (err: any) {
      console.error('Failed to load suppliers:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await purchaseOrderService.create(formData);
      setShowModal(false);
      setFormData({ supplierId: '', totalAmount: 0, notes: '' });
      fetchOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMarkAsReceived = async (id: string) => {
    if (!confirm('Mark this order as received?')) return;
    try {
      await purchaseOrderService.markAsReceived(id, { receivedDate: new Date() });
      fetchOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this order?')) return;
    try {
      await purchaseOrderService.cancel(id);
      fetchOrders();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      received: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Purchase Orders | Dashboard" description="Manage purchase orders" />
      <PageBreadcrumb pageTitle="Purchase Orders" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Purchase Orders</h2>
            <p className="text-gray-600 dark:text-gray-400">Track orders from suppliers</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Order
          </Button>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Supplier</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Notes</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{order.supplierName}</td>
                    <td className="px-6 py-4">TND {order.totalAmount}</td>
                    <td className="px-6 py-4">{new Date(order.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{order.notes || '-'}</td>
                    <td className="px-6 py-4">
                      {order.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMarkAsReceived(order.id)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Receive
                          </button>
                          <button
                            onClick={() => handleCancel(order.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Modal isOpen={showModal} onClose={handleCloseModal} className="max-w-md">
          <div className="p-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">New Purchase Order</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Supplier</Label>
                <select
                  required
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Total Amount</Label>
                <Input
                  type="number"
                  required
                  min={0}
                  step={0.01}
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Notes</Label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit">Create Order</Button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </>
  );
}
