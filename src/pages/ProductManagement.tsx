import { useState, useEffect, useMemo } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import { productService, Product, CreateProductDto } from "../services/product.service";
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

interface ProductFormData {
  name: string;
  price: string;
  category: string;
  description: string;
  initialQuantity: string;
  minimumStock: string;
  usedFor: 'sales' | 'purchases' | 'both';
  productType: 'storable' | 'consumable' | 'service';
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    price: "",
    category: "",
    description: "",
    initialQuantity: "",
    minimumStock: "",
    usedFor: "both",
    productType: "storable",
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "storable" | "consumable" | "service">("all");
  const [usedForFilter, setUsedForFilter] = useState<"all" | "sales" | "purchases" | "both">("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productService.getProducts();
      setProducts(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(p => p.productType === typeFilter);
    }

    if (usedForFilter !== "all") {
      filtered = filtered.filter(p => p.usedFor === usedForFilter);
    }

    if (minPrice) {
      filtered = filtered.filter(p => Number(p.price) >= Number(minPrice));
    }

    if (maxPrice) {
      filtered = filtered.filter(p => Number(p.price) <= Number(maxPrice));
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, categoryFilter, typeFilter, usedForFilter, minPrice, maxPrice]);

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setTypeFilter("all");
    setUsedForFilter("all");
    setMinPrice("");
    setMaxPrice("");
  };

  const hasActiveFilters = searchQuery || categoryFilter || typeFilter !== "all" || usedForFilter !== "all" || minPrice || maxPrice;

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setIsEditing(true);
      setCurrentProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        category: product.category || "",
        description: product.description || "",
        initialQuantity: "",
        minimumStock: product.minimumStock?.toString() || "",
        usedFor: product.usedFor,
        productType: product.productType,
      });
    } else {
      setIsEditing(false);
      setCurrentProduct(null);
      setFormData({
        name: "",
        price: "",
        category: "",
        description: "",
        initialQuantity: "",
        minimumStock: "",
        usedFor: "both",
        productType: "storable",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setCurrentProduct(null);
  };

  const handleChange = (field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      const productData: CreateProductDto = {
        name: formData.name,
        price: parseFloat(formData.price) || 0,
        category: formData.category || undefined,
        description: formData.description || undefined,
        initialQuantity: formData.initialQuantity ? parseInt(formData.initialQuantity) : undefined,
        minimumStock: formData.minimumStock ? parseInt(formData.minimumStock) : undefined,
        usedFor: formData.usedFor,
        productType: formData.productType,
      };

      if (isEditing && currentProduct) {
        await productService.updateProduct(currentProduct.id, productData);
      } else {
        await productService.createProduct(productData);
      }

      await fetchProducts();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || "Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await productService.deleteProduct(id);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || "Failed to delete product");
    }
  };

  const columns = useMemo(
    () => [
      { key: "name", title: "Product Name" },
      { key: "category", title: "Category" },
      { key: "price", title: "Price" },
      { key: "actions", title: "Actions" },
    ],
    []
  );

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = products.length;
    const totalValue = products.reduce((sum, p) => sum + Number(p.price), 0);
    const lowStock = products.filter(p => p.productType === 'storable' && p.minimumStock !== undefined && p.minimumStock > 0).length;
    const services = products.filter(p => p.productType === 'service').length;
    return { total, totalValue, lowStock, services };
  }, [products]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <PageBreadcrumb pageTitle="Product Management" />

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Products & Services
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your product catalog for invoicing
            </p>
          </div>
          <Button onClick={() => handleOpenModal()}>
            + Add Product
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Filter Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white w-full md:w-64"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Categories</option>
              <option value="Product">Product</option>
              <option value="Service">Service</option>
              <option value="Raw Material">Raw Material</option>
              <option value="Equipment">Equipment</option>
              <option value="Consumable">Consumable</option>
              <option value="Software">Software</option>
              <option value="Other">Other</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="storable">Storable</option>
              <option value="consumable">Consumable</option>
              <option value="service">Service</option>
            </select>
            <select
              value={usedForFilter}
              onChange={(e) => setUsedForFilter(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Uses</option>
              <option value="sales">Sales Only</option>
              <option value="purchases">Purchases Only</option>
              <option value="both">Sales & Purchases</option>
            </select>
            <input
              type="number"
              placeholder="Min price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white w-32"
            />
            <input
              type="number"
              placeholder="Max price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white w-32"
            />
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3">
              {searchQuery && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery("")} className="ml-1 text-blue-600 hover:text-blue-800">×</button>
                </span>
              )}
              {categoryFilter && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Category: {categoryFilter}
                  <button onClick={() => setCategoryFilter("")} className="ml-1 text-green-600 hover:text-green-800">×</button>
                </span>
              )}
              {typeFilter !== "all" && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Type: {typeFilter}
                  <button onClick={() => setTypeFilter("all")} className="ml-1 text-purple-600 hover:text-purple-800">×</button>
                </span>
              )}
              {minPrice && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Min: TND {minPrice}
                  <button onClick={() => setMinPrice("")} className="ml-1 text-orange-600 hover:text-orange-800">×</button>
                </span>
              )}
              {maxPrice && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Max: TND {maxPrice}
                  <button onClick={() => setMaxPrice("")} className="ml-1 text-orange-600 hover:text-orange-800">×</button>
                </span>
              )}
            </div>
          )}
          <div className="text-sm text-gray-500 mt-2">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.total}</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Services</p>
                <h3 className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">{summaryStats.services}</h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Low Stock</p>
                <h3 className={`mt-2 text-2xl font-bold ${summaryStats.lowStock > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{summaryStats.lowStock}</h3>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${summaryStats.lowStock > 0 ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Price</p>
                <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {summaryStats.total > 0 ? (summaryStats.totalValue / summaryStats.total).toFixed(2) : '0.00'}
                </h3>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-700/50">
              <TableRow>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    isHeader
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {col.title}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    {hasActiveFilters ? "No products match your filters." : "No products found. Add your first product to get started."}
                  </td>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <TableCell className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {product.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        {product.category || "Uncategorized"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                      TND {Number(product.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(product)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(product.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        className="max-w-2xl"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {isEditing ? "Edit Product" : "Add New Product"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Product Name *</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter product name"
              />
            </div>

            <div>
              <Label>Price *</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Category</Label>
              <select
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select category...</option>
                <option value="Product">Product</option>
                <option value="Service">Service</option>
                <option value="Raw Material">Raw Material</option>
                <option value="Equipment">Equipment</option>
                <option value="Consumable">Consumable</option>
                <option value="Software">Software</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <Label>Product Type *</Label>
              <select
                value={formData.productType}
                onChange={(e) => handleChange("productType", e.target.value as 'storable' | 'consumable' | 'service')}
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="storable">Storable (has stock)</option>
                <option value="consumable">Consumable (no tracking)</option>
                <option value="service">Service (no physical)</option>
              </select>
            </div>

            <div>
              <Label>Used For *</Label>
              <select
                value={formData.usedFor}
                onChange={(e) => handleChange("usedFor", e.target.value as 'sales' | 'purchases' | 'both')}
                className="w-full h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="both">Sales & Purchases</option>
                <option value="sales">Sales only</option>
                <option value="purchases">Purchases only</option>
              </select>
            </div>

            {!isEditing && formData.productType === 'storable' && (
              <div>
                <Label>Initial Quantity</Label>
                <Input
                  type="number"
                  value={formData.initialQuantity}
                  onChange={(e) => handleChange("initialQuantity", e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Starting stock</p>
              </div>
            )}

            {formData.productType === 'storable' && (
              <div>
                <Label>Min Stock Level</Label>
                <Input
                  type="number"
                  value={formData.minimumStock}
                  onChange={(e) => handleChange("minimumStock", e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Low stock alert</p>
              </div>
            )}

            <div className="md:col-span-2">
              <Label>Description</Label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Product description..."
                className="w-full h-20 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.price ? true : false}
            >
              {isEditing ? "Update" : "Create"} Product
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
