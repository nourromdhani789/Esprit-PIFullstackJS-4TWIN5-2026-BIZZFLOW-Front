import { useState, useEffect } from 'react';
import { stockMovementService } from '../services/stock-movement.service';
import { productService, Product as ServiceProduct } from '../services/product.service';
import PageMeta from '../components/common/PageMeta';
import PageBreadcrumb from '../components/common/PageBreadCrumb';

interface Product extends ServiceProduct {
  quantity: number;
  minimumStock: number;
}

export default function StockManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // error is available for future use
  void error;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsData, lowStockData] = await Promise.all([
        productService.getProducts(),
        stockMovementService.getLowStockProducts(),
      ]);
      setProducts(productsData as Product[]);
      setLowStockProducts(lowStockData as Product[]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load stock data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isLowStock = (product: Product) => {
    return product.quantity <= product.minimumStock;
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
      <PageMeta title="Stock Management | Dashboard" description="Manage your inventory stock levels" />
      <PageBreadcrumb pageTitle="Stock Management" />

      <div className="space-y-6">
        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="font-medium text-red-800 dark:text-red-200">
                Low Stock Alert ({lowStockProducts.length} products)
              </h3>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Inventory</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Current Stock</th>
                  <th className="px-6 py-3">Min. Stock</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{product.name}</td>
                    <td className="px-6 py-4">{product.category || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={isLowStock(product) ? 'text-red-600 font-bold' : ''}>
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">{product.minimumStock}</td>
                    <td className="px-6 py-4">TND {product.price}</td>
                    <td className="px-6 py-4">
                      {isLowStock(product) ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Products Summary */}
        {lowStockProducts.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Low Stock Products</h2>
            </div>
            <div className="p-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-red-800 dark:text-red-200">{product.name}</h3>
                      <span className="rounded-full bg-red-200 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-800 dark:text-red-200">
                        {product.quantity} left
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                      Minimum: {product.minimumStock} | Price: TND {product.price}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
