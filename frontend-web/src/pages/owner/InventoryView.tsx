// frontend-web/src/pages/owner/InventoryView.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import productService from "../../services/productService";
import { Package, AlertTriangle, TrendingDown } from "lucide-react";

interface Product {
  product_id: number;
  product_name: string;
  product_code: string;
  unit_price: number;
  store_stock: number;
  van_stock: number;
  total_stock: number;
  low_stock_threshold: number;
  nearest_expiry: string;
}

export default function InventoryView() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response: any = await productService.getAllProducts();
      
      if (response.success) {
        setInventory(response.data);
      } else {
        setError('Failed to fetch inventory');
      }
    } catch (err: any) {
      console.error('Error fetching inventory:', err);
      setError(err.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={fetchInventory}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Calculate statistics
  const lowStockCount = inventory.filter(item => item.total_stock < item.low_stock_threshold).length;
  const totalProducts = inventory.length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.total_stock * item.unit_price), 0);

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                <h3 className="text-2xl font-bold text-gray-900">{totalProducts}</h3>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Package className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Low Stock Items</p>
                <h3 className="text-2xl font-bold text-red-600">{lowStockCount}</h3>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Inventory Value</p>
                <h3 className="text-2xl font-bold text-green-600">
                  LKR {totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <TrendingDown className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Code</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Unit Price (LKR)</TableHead>
                  <TableHead className="text-right">Store Stock</TableHead>
                  <TableHead className="text-right">Van Stock</TableHead>
                  <TableHead className="text-right">Total Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  inventory.map((item) => {
                    const isLowStock = item.total_stock < item.low_stock_threshold;
                    
                    return (
                      <TableRow key={item.product_id}>
                        <TableCell className="font-medium">{item.product_code || '-'}</TableCell>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell className="text-right">
                          {item.unit_price.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={isLowStock ? 'text-red-600 font-semibold' : ''}>
                            {item.store_stock}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{item.van_stock}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.total_stock}
                        </TableCell>
                        <TableCell>
                          {isLowStock ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              In Stock
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Warning Message */}
          {lowStockCount > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">
                  {lowStockCount} {lowStockCount === 1 ? 'product is' : 'products are'} running low on stock
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Items highlighted in red are below their minimum threshold and need restocking.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}