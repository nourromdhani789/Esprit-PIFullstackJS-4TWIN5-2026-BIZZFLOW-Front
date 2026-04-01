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
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
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
  });

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
              {products.length === 0 ? (
                <TableRow>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    No products found. Add your first product to get started.
                  </td>
                </TableRow>
              ) : (
                products.map((product) => (
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
                      ${Number(product.price).toFixed(2)}
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
        className="max-w-lg"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {isEditing ? "Edit Product" : "Add New Product"}
          </h2>

          <div className="space-y-4">
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
              <Input
                type="text"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                placeholder="e.g., Services, Products"
              />
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Product description..."
                className="w-full h-24 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            {!isEditing && (
              <div>
                <Label>Initial Quantity</Label>
                <Input
                  type="number"
                  value={formData.initialQuantity}
                  onChange={(e) => handleChange("initialQuantity", e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Starting stock quantity for this product</p>
              </div>
            )}

            <div>
              <Label>Minimum Stock Level</Label>
              <Input
                type="number"
                value={formData.minimumStock}
                onChange={(e) => handleChange("minimumStock", e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Alert when stock falls below this level</p>
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
