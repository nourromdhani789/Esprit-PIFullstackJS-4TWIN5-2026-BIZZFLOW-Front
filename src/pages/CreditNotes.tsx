import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { creditNoteService, CreditNote, CreateCreditNoteDto } from '../services/credit-note.service';
import { clientService, Client } from '../services/client.service';
import { invoiceService, Invoice } from '../services/invoice.service';
import PageMeta from '../components/common/PageMeta';
import PageBreadcrumb from '../components/common/PageBreadCrumb';
import Button from '../components/ui/button/Button';
import Label from '../components/form/Label';
import Input from '../components/form/input/InputField';
import { Modal } from '../components/ui/modal';

// Reason options with labels
const reasonOptions = [
  { value: 'returned_goods', label: 'Returned goods' },
  { value: 'pricing_error', label: 'Pricing error' },
  { value: 'product_expired_or_damaged', label: 'Product expired or damaged' },
  { value: 'service_not_delivered', label: 'Service not delivered' },
  { value: 'partial_refund', label: 'Partial refund' },
  { value: 'other', label: 'Other' },
];

// Format amount in TND with 3 decimals
const formatTND = (amount: number) => {
  return `TND ${Number(amount).toFixed(3)}`;
};

// Get human readable reason label
const getReasonLabel = (reason: string) => {
  const option = reasonOptions.find(opt => opt.value === reason);
  return option?.label || reason;
};

export default function CreditNotes() {
  const navigate = useNavigate();
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState<CreateCreditNoteDto>({
    clientId: '',
    clientName: '',
    amount: 0,
    reason: 'other' as const,
    reasonDetails: '',
    reference: '',
    invoiceId: '',
  });

  useEffect(() => {
    fetchCreditNotes();
    fetchClients();
    fetchInvoices();
  }, []);

  const fetchCreditNotes = async () => {
    try {
      setLoading(true);
      const data = await creditNoteService.getAll();
      setCreditNotes(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load credit notes');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await clientService.getClients();
      setClients(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load clients');
    }
  };

  const fetchInvoices = async () => {
    try {
      const data = await invoiceService.getInvoices();
      setInvoices(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoices');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      clientId: '',
      clientName: '',
      amount: 0,
      reason: 'other' as const,
      reasonDetails: '',
      reference: '',
      invoiceId: '',
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await creditNoteService.create(formData);
      handleCloseModal();
      fetchCreditNotes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this credit note?')) return;
    try {
      await creditNoteService.approve(id);
      fetchCreditNotes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApply = async (id: string) => {
    if (!confirm('Apply this credit note to the linked invoice?')) return;
    try {
      await creditNoteService.apply(id);
      fetchCreditNotes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRefund = async (id: string) => {
    if (!confirm('Mark this credit note as refunded? This will create a payment.')) return;
    try {
      await creditNoteService.refund(id);
      fetchCreditNotes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this credit note?')) return;
    try {
      await creditNoteService.cancel(id);
      fetchCreditNotes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      applied: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      refunded: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Calculate total of approved credit notes (active ones)
  const totalActive = creditNotes
    .filter(cn => cn.status === 'approved')
    .reduce((sum, cn) => sum + Number(cn.amount), 0);

  const approvedCount = creditNotes.filter(cn => cn.status === 'approved').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Credit Notes | Dashboard" description="Manage credit notes" />
      <PageBreadcrumb pageTitle="Credit Notes" />

      <div className="space-y-6">
        {/* Summary Card */}
        <div className="rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Active Credit Notes</p>
              <h2 className="text-4xl font-bold">{formatTND(totalActive)}</h2>
              <p className="text-purple-200 text-sm mt-1">{approvedCount} approved credit notes</p>
            </div>
            <div className="rounded-full bg-white/20 p-4">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Credit Notes</h2>
            <p className="text-gray-600 dark:text-gray-400">Refund and correction vouchers</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Credit Note
          </Button>
        </div>

        {/* Credit Notes Table */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Linked Invoice</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {creditNotes.map((creditNote) => (
                  <tr key={creditNote.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">{new Date(creditNote.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{creditNote.clientName}</td>
                    <td className="px-6 py-4">{formatTND(creditNote.amount)}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{getReasonLabel(creditNote.reason)}</td>
                    <td className="px-6 py-4">
                      {creditNote.invoice?.invoiceNumber ? (
                        <button
                          onClick={() => navigate(`/invoices/${creditNote.invoiceId}`)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {creditNote.invoice.invoiceNumber}
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(creditNote.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {/* Draft status actions */}
                        {creditNote.status === 'draft' && (
                          <>
                            <button
                              onClick={() => handleApprove(creditNote.id)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleCancel(creditNote.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {/* Approved status actions */}
                        {creditNote.status === 'approved' && (
                          <>
                            {creditNote.invoiceId && (
                              <button
                                onClick={() => handleApply(creditNote.id)}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              >
                                Apply
                              </button>
                            )}
                            <button
                              onClick={() => handleRefund(creditNote.id)}
                              className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                            >
                              Refund
                            </button>
                            <button
                              onClick={() => handleCancel(creditNote.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {/* Applied/Refunded/Cancelled - no actions */}
                        {(creditNote.status === 'applied' || creditNote.status === 'refunded' || creditNote.status === 'cancelled') && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Modal isOpen={showModal} onClose={handleCloseModal} className="max-w-md">
          <div className="p-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">New Credit Note</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Client *</Label>
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => {
                    const selectedClient = clients.find(c => c.id === e.target.value);
                    setFormData({
                      ...formData,
                      clientId: e.target.value,
                      clientName: selectedClient?.name || '',
                      invoiceId: '' // Clear invoice when client changes
                    });
                  }}
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.email ? `(${client.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  min="0"
                  step={0.001}
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.000"
                />
              </div>

              <div>
                <Label>Reason *</Label>
                <select
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value as CreateCreditNoteDto['reason'] })}
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a reason...</option>
                  {reasonOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.reason === 'other' && (
                <div>
                  <Label>Please specify</Label>
                  <textarea
                    rows={2}
                    value={formData.reasonDetails}
                    onChange={(e) => setFormData({ ...formData, reasonDetails: e.target.value })}
                    placeholder="Enter details..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              <div>
                <Label>Linked Invoice (Optional)</Label>
                <select
                  value={formData.invoiceId}
                  onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
                  disabled={!formData.clientId}
                  className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {formData.clientId ? 'Select an invoice...' : 'Select a client first...'}
                  </option>
                  {invoices
                    .filter((invoice) => invoice.client?.id === formData.clientId)
                    .map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoiceNumber} ({formatTND(invoice.totalAmount)})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit">Create Credit Note</Button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </>
  );
}
