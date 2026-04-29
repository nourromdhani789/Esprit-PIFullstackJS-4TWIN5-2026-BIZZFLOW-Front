import { useState, useEffect, type FormEvent } from 'react';
import { stockTakeService, StockTake, StockTakeItem } from '../services/stock-take.service';
import PageMeta from '../components/common/PageMeta';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import Button from '../components/ui/button/Button';
import Label from '../components/form/Label';
import Input from '../components/form/input/InputField';
import { Modal } from '../components/ui/modal';

export default function StockTakePage() {
  const [stockTakes, setStockTakes] = useState<StockTake[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeStockTake, setActiveStockTake] = useState<{ stockTake: StockTake; items: StockTakeItem[] } | null>(null);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleCloseCountModal = () => {
    setActiveStockTake(null);
  };
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    countDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchStockTakes();
  }, []);

  const fetchStockTakes = async () => {
    try {
      setLoading(true);
      const data = await stockTakeService.getAll();
      setStockTakes(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await stockTakeService.create({
        name: formData.name,
        description: formData.description,
        countDate: new Date(formData.countDate),
      });
      setShowModal(false);
      setFormData({ name: '', description: '', countDate: new Date().toISOString().split('T')[0] });
      fetchStockTakes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await stockTakeService.start(id);
      fetchStockTakes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenCount = async (id: string) => {
    try {
      const data = await stockTakeService.getById(id);
      setActiveStockTake(data);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCountProduct = async (itemId: string, countedQuantity: number) => {
    if (!activeStockTake) return;
    try {
      await stockTakeService.updateItem(itemId, { countedQuantity });
      const updated = await stockTakeService.getById(activeStockTake.stockTake.id);
      setActiveStockTake(updated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleComplete = async (adjust: boolean) => {
    if (!activeStockTake) return;
    try {
      await stockTakeService.complete(activeStockTake.stockTake.id, adjust ? 'adjust' : 'review');
      setActiveStockTake(null);
      fetchStockTakes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this stock take?')) return;
    try {
      await stockTakeService.cancel(id);
      fetchStockTakes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this stock take?')) return;
    try {
      await stockTakeService.delete(id);
      fetchStockTakes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    const labels: Record<string, string> = {
      draft: 'Draft',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || status}
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
      <PageMeta title="Stock Take | Dashboard" description="Inventory stock take and counting" />
      <PageBreadcrumb pageTitle="Stock Take" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Stock Take / Inventory Count</h2>
            <p className="text-gray-600 dark:text-gray-400">Physical inventory counting and adjustments</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Stock Take
          </Button>
        </div>

        {/* Stock Takes List */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Progress</th>
                  <th className="px-6 py-3">Discrepancies</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockTakes.map((stockTake) => (
                  <tr key={stockTake.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{stockTake.name}</td>
                    <td className="px-6 py-4">{stockTake.countDate ? new Date(stockTake.countDate).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(stockTake.status)}</td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${stockTake.totalProducts > 0 ? (stockTake.productsCounted / stockTake.totalProducts) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs">{stockTake.productsCounted}/{stockTake.totalProducts}</span>
                    </td>
                    <td className="px-6 py-4">
                      {stockTake.discrepancies > 0 ? (
                        <span className="text-red-600 font-medium">{stockTake.discrepancies}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      {stockTake.status === 'draft' && (
                        <button
                          onClick={() => handleStart(stockTake.id)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Start
                        </button>
                      )}
                      {stockTake.status === 'in_progress' && (
                        <button
                          onClick={() => handleOpenCount(stockTake.id)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Count
                        </button>
                      )}
                      {stockTake.status !== 'completed' && stockTake.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancel(stockTake.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(stockTake.id)}
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Stock Take Modal */}
        <Modal isOpen={showModal} onClose={handleCloseModal} className="max-w-md">
          <div className="p-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">New Stock Take</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Monthly Inventory Count"
                />
              </div>

              <div>
                <Label>Description (Optional)</Label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <Label>Count Date</Label>
                <Input
                  type="date"
                  value={formData.countDate}
                  onChange={(e) => setFormData({ ...formData, countDate: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit">Create Stock Take</Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Counting Modal */}
        <Modal isOpen={!!activeStockTake} onClose={handleCloseCountModal} className="max-w-4xl">
          {activeStockTake && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{activeStockTake.stockTake.name}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Progress: {activeStockTake.stockTake.productsCounted}/{activeStockTake.stockTake.totalProducts} products
                    {activeStockTake.stockTake.discrepancies > 0 && (
                      <span className="ml-2 text-red-600">({activeStockTake.stockTake.discrepancies} discrepancies)</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {activeStockTake.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">System: {item.systemQuantity}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {item.countedQuantity !== undefined && item.countedQuantity !== null && (
                        <div className={`text-sm font-medium ${item.difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.difference === 0 ? '✓ Match' : `Diff: ${item.difference > 0 ? '+' : ''}${item.difference}`}
                        </div>
                      )}
                      <input
                        type="number"
                        min={0}
                        placeholder="Count"
                        value={item.countedQuantity ?? ''}
                        onChange={(e) => handleCountProduct(item.id, parseInt(e.target.value) || 0)}
                        className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="button" variant="outline" onClick={handleCloseCountModal}>
                  Save & Close
                </Button>
                <Button type="button" variant="outline" onClick={() => handleComplete(false)}>
                  Complete (Review Only)
                </Button>
                <Button onClick={() => handleComplete(true)}>
                  Complete & Adjust Stock
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
}
