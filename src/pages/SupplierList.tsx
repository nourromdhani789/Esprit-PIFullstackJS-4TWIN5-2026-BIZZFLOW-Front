import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { supplierService, Supplier } from "../services/supplier.service";
import Button from "../components/ui/button/Button";
import Label from "../components/form/Label";
import Input from "../components/form/input/InputField";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Modal } from "../components/ui/modal";

function formatTND(amount: number): string {
  return `TND ${Number(amount || 0).toFixed(3)}`;
}

export default function SupplierList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSuppliers(suppliers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredSuppliers(
        suppliers.filter(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            (s.email && s.email.toLowerCase().includes(query)) ||
            (s.phone && s.phone.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, suppliers]);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
      setFilteredSuppliers(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load suppliers");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary stats
  const totalSuppliers = suppliers.length;
  const totalPurchased = suppliers.reduce((sum, s) => sum + (s.totalPurchased || 0), 0);
  const totalOutstanding = suppliers.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);

  const handleSubmit = async () => {
    if (!formData.name) {
      setError("Supplier name is required");
      return;
    }

    try {
      setIsLoading(true);
      if (editingSupplier) {
        await supplierService.updateSupplier(editingSupplier.id, formData);
      } else {
        await supplierService.createSupplier(formData);
      }
      await fetchSuppliers();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || "Failed to save supplier");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
      });
    } else {
      setEditingSupplier(null);
      setFormData({ name: "", email: "", phone: "", address: "" });
    }
    setError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    setFormData({ name: "", email: "", phone: "", address: "" });
    setError("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    try {
      setIsLoading(true);
      await supplierService.deleteSupplier(id);
      await fetchSuppliers();
    } catch (err: any) {
      setError(err.message || "Failed to delete supplier");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProfile = (id: string) => {
    navigate(`/suppliers/${id}`);
  };

  const canDelete = (supplier: Supplier) => {
    // Only allow delete if no orders or expenses
    return (supplier.orderCount || 0) === 0 && (supplier.expenseCount || 0) === 0;
  };

  return (
    <div className="p-4">
      <PageBreadcrumb pageTitle="Suppliers" />

      <div className="max-w-6xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Suppliers</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {totalSuppliers}
            </h3>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Purchased</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatTND(totalPurchased)}
            </h3>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Outstanding Balance</p>
            <h3 className={`text-2xl font-bold mt-1 ${totalOutstanding > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {formatTND(totalOutstanding)}
            </h3>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Suppliers
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your suppliers and view purchase history
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            + Add Supplier
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

      {/* Add/Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        className="max-w-xl"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Supplier Name *</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter supplier name"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="supplier@example.com"
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 890"
              />
            </div>

            <div className="md:col-span-2">
              <Label>Address</Label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Supplier address..."
                className="w-full h-20 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              onClick={() => handleSubmit()}
              disabled={!formData.name || isLoading}
            >
              {isLoading ? "Saving..." : (editingSupplier ? "Update" : "Save")}
            </Button>
          </div>
        </div>
      </Modal>

        {/* Suppliers Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          {filteredSuppliers.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? "No suppliers match your search." : "No suppliers yet. Click \"Add Supplier\" to create one."}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-700/50">
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Name
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Email
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Phone
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Orders
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Total Purchased
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Outstanding
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {supplier.name}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {supplier.email || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {supplier.phone || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                      {supplier.orderCount || 0}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">
                      {formatTND(supplier.totalPurchased || 0)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <span className={(supplier.outstandingBalance || 0) > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                        {formatTND(supplier.outstandingBalance || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleViewProfile(supplier.id)}
                        >
                          View Profile
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(supplier)}
                        >
                          Edit
                        </Button>
                        {canDelete(supplier) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(supplier.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
