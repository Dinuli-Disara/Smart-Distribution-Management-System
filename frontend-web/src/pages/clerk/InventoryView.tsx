// frontend-web/src/pages/clerk/InventoryView.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import productService from "../../services/productService";
import inventoryService from "../../services/inventoryService";
import stockTransferService from "../../services/stockTransferService";
import productApprovalService from "../../services/productApprovalService";
import { Button } from "../../components/ui/button";
import { Input, Label } from "../../components/ui/form-components";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Plus, Package, Truck, Box, AlertTriangle } from "lucide-react";

interface Product {
  product_id: number;
  product_name: string;
  product_code: string;
  unit_price: number;
  store_stock: number;
  kiribathgoda_van_stock: number;
  battaramulla_van_stock: number;
  homagama_van_stock: number;
  total_stock: number;
  low_stock_threshold: number;
  nearest_expiry: string;
}

interface Van {
  van_id: number;
  vehicle_number: string;
  assigned_employee: string;
}

interface AvailableProduct {
  product_id: number;
  product_name: string;
  product_code: string;
  unit_price: number;
  available_quantity: number;
  nearest_expiry: string;
}

interface NewProductData {
  product_name: string;
  product_code: string;
  product_description: string;
  unit_price: string;
  low_stock_threshold: string;
  manufacturer_id: number;
}

export default function InventoryView() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New state for dropdown options
  const [productOptions, setProductOptions] = useState<AvailableProduct[]>([]);
  const [vanOptions, setVanOptions] = useState<Van[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // State for dialogs
  const [showReceiveStock, setShowReceiveStock] = useState(false);
  const [showTransferToVan, setShowTransferToVan] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // State for Receive Stock form
  const [receiveStockData, setReceiveStockData] = useState({
    product_id: "",
    quantity: "",
    expiryDate: "",
    batch_number: "",  // Changed from batchNo to match API
    unit_price: "",
    purchase_id: ""    // Optional, for linking to purchase order
  });

  // State for Transfer to Van form
  const [transferData, setTransferData] = useState({
    product_id: "",
    quantity: "",
    batchNo: "",
    to_van_id: ""      // Changed from 'van' to match API
  });

  // State for Add New Product form
  const [newProductData, setNewProductData] = useState({
    product_name: "",      // Changed from productName
    product_code: "",      // Added
    product_description: "",   // Added
    unit_price: "",
    low_stock_threshold: "10", // Added default
    manufacturer_id: 1
  });

  useEffect(() => {
    fetchInventory();
    fetchOptions();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await productService.getAllProducts();

      if (response.data.success) {
        // Transform the data to match your component's expected format
        const transformedData = transformInventoryData(response.data.data);
        setInventory(transformedData);
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

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);

      // Fetch available products for dropdowns
      const productsResponse = await stockTransferService.getAvailableStock();
      if (productsResponse.data.success) {
        setProductOptions(productsResponse.data.data);
      }

      // Fetch vans - you might need to add this to your vanService
      // For now, you can get vans from inventory service
      const vansResponse = await inventoryService.getVanInventory();
      if (vansResponse.data.success) {
        const vans = vansResponse.data.data.map((van: any) => ({
          van_id: van.van_id,
          vehicle_number: van.vehicle_number,
          assigned_employee: van.assigned_employee
        }));
        setVanOptions(vans);
      }
    } catch (err) {
      console.error('Error fetching options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Transform the data from API to match your component's format
  const transformInventoryData = (apiData: any[]): Product[] => {
    return apiData.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      product_code: item.product_code || '-',
      unit_price: item.unit_price,
      store_stock: item.store_stock || 0,
      // You'll need to populate these from van stock data
      kiribathgoda_van_stock: 0,
      battaramulla_van_stock: 0,
      homagama_van_stock: 0,
      total_stock: item.total_stock || 0,
      low_stock_threshold: item.low_stock_threshold || 10,
      nearest_expiry: item.nearest_expiry || ''
    }));
  };

  // Handle Receive Stock form submission
  const handleReceiveStock = async () => {
    try {
      const payload = {
        items: [{
          product_id: parseInt(receiveStockData.product_id),
          quantity: parseInt(receiveStockData.quantity),
          batch_number: receiveStockData.batch_number,
          expiry_date: receiveStockData.expiryDate,
          unit_price: parseFloat(receiveStockData.unit_price)
        }]
        // Add purchase_id if you have it
      };

      if (receiveStockData.purchase_id) {
        // @ts-ignore
        payload.purchase_id = parseInt(receiveStockData.purchase_id);
      }

      const response = await inventoryService.receiveStock(payload);

      if (response.data.success) {
        // Reset form
        setReceiveStockData({
          product_id: "",
          quantity: "",
          expiryDate: "",
          batch_number: "",
          unit_price: "",
          purchase_id: ""
        });

        // Close dialog and refresh inventory
        setShowReceiveStock(false);
        fetchInventory();
        fetchOptions(); // Refresh available products
      }
    } catch (err: any) {
      console.error('Error receiving stock:', err);
      alert(err.response?.data?.message || 'Failed to receive stock');
    }
  };

  // Handle Transfer to Van form submission
  const handleTransferToVan = async () => {
    try {
      const payload = {
        to_van_id: parseInt(transferData.to_van_id),
        items: [{
          product_id: parseInt(transferData.product_id),
          quantity: parseInt(transferData.quantity)
        }]
      };

      const response = await stockTransferService.createTransfer(payload);

      if (response.data.success) {
        // Reset form
        setTransferData({
          product_id: "",
          quantity: "",
          batchNo: "",
          to_van_id: ""
        });

        // Close dialog and refresh inventory
        setShowTransferToVan(false);
        fetchInventory();
        fetchOptions(); // Refresh available products
      }
    } catch (err: any) {
      console.error('Error transferring stock:', err);
      alert(err.response?.data?.message || 'Failed to transfer stock');
    }
  };

  // Handle Add New Product form submission
  // In InventoryView.tsx, update the handleAddProduct function
  const handleAddProduct = async () => {
    try {
      // Validate required fields
      if (!newProductData.product_name || !newProductData.product_code ||
        !newProductData.unit_price || !newProductData.low_stock_threshold) {
        alert('Please fill in all required fields');
        return;
      }

      const payload = {
        product_name: newProductData.product_name,
        product_code: newProductData.product_code,
        product_description: newProductData.product_description || null,
        unit_price: parseFloat(newProductData.unit_price),
        low_stock_threshold: parseInt(newProductData.low_stock_threshold),
        manufacturer_id: newProductData.manufacturer_id
      };

      const response = await productApprovalService.createRequest(payload);

      if (response.data.success) {
        // Reset form
        setNewProductData({
          product_name: "",
          product_code: "",
          product_description: "",
          unit_price: "",
          low_stock_threshold: "10",
          manufacturer_id: 1
        });

        setShowAddProduct(false);

        // Show appropriate message
        if (response.data.warning) {
          alert('Product request submitted! Note: ' + response.data.warning);
        } else {
          alert('Product request submitted successfully! An admin will review and approve it.');
        }

        // Optionally refresh to show pending requests
        fetchInventory();
        fetchOptions();
      }
    } catch (err: any) {
      console.error('Error submitting product request:', err);
      const errorMessage = err.response?.data?.message || 'Failed to submit product request';
      alert(`Error: ${errorMessage}`);
    }
  };

  // Calculate total van stock for each location (you'll need to implement this properly)
  const calculateTotalKiribathgodaStock = () => {
    return 0; // Implement based on your data structure
  };

  const calculateTotalBattaramullaStock = () => {
    return 0; // Implement based on your data structure
  };

  const calculateTotalHomagamaStock = () => {
    return 0; // Implement based on your data structure
  };

  const calculateTotalVanStock = () => {
    return 0; // Implement based on your data structure
  };

  // Rest of your component remains the same...
  // (Keep all the JSX code exactly as you had it, but update the dropdowns)

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
      {/* Summary Cards - Keep as is */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* ... keep all your existing summary cards ... */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                <h3 className="text-2xl font-bold text-gray-900">{totalProducts}</h3>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Package className="w-6 h-6 text-blue-600" />
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
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Van Stock</p>
                <h3 className="text-2xl font-bold text-purple-600">
                  {calculateTotalVanStock()}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons Card - Keep as is */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Inventory Actions</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowReceiveStock(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Package className="w-4 h-4 mr-2" />
              Receive Stock
            </Button>
            <Button
              onClick={() => setShowTransferToVan(true)}
              variant="outline"
              className="border-blue-900 text-blue-900 hover:bg-blue-50"
            >
              <Truck className="w-4 h-4 mr-2" />
              Transfer to Van
            </Button>
            <Button
              onClick={() => setShowAddProduct(true)}
              className="bg-blue-900 hover:bg-blue-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Product
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Inventory Table - Keep as is */}
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
                  <TableHead className="text-right text-blue-900">Kiribathgoda</TableHead>
                  <TableHead className="text-right text-green-900">Battaramulla</TableHead>
                  <TableHead className="text-right text-orange-900">Homagama</TableHead>
                  <TableHead className="text-right">Total Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                      No products found. Add your first product using the "Add New Product" button.
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
                        <TableCell className="text-right text-blue-900 font-medium">
                          {item.kiribathgoda_van_stock || 0}
                        </TableCell>
                        <TableCell className="text-right text-green-900 font-medium">
                          {item.battaramulla_van_stock || 0}
                        </TableCell>
                        <TableCell className="text-right text-orange-900 font-medium">
                          {item.homagama_van_stock || 0}
                        </TableCell>
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

          {/* Warning Message - Keep as is */}
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

      {/* Receive Stock Dialog - Updated dropdown */}
      <Dialog open={showReceiveStock} onOpenChange={setShowReceiveStock}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              Receive Stock
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="product-select">Product *</Label>
              <select
                id="product-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={receiveStockData.product_id}
                onChange={(e) => setReceiveStockData({ ...receiveStockData, product_id: e.target.value })}
                required
                disabled={loadingOptions}
              >
                <option value="">Select a product</option>
                {productOptions.map((product) => (
                  <option key={product.product_id} value={product.product_id}>
                    {product.product_name} (Available: {product.available_quantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Enter quantity"
                  value={receiveStockData.quantity}
                  onChange={(e) => setReceiveStockData({ ...receiveStockData, quantity: e.target.value })}
                  required
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit-price">Unit Price (LKR) *</Label>
                <Input
                  id="unit-price"
                  type="number"
                  placeholder="Enter price"
                  value={receiveStockData.unit_price}
                  onChange={(e) => setReceiveStockData({ ...receiveStockData, unit_price: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch-no">Batch No. *</Label>
                <Input
                  id="batch-no"
                  type="text"
                  placeholder="Enter batch number"
                  value={receiveStockData.batch_number}
                  onChange={(e) => setReceiveStockData({ ...receiveStockData, batch_number: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry-date">Expiry Date *</Label>
                <Input
                  id="expiry-date"
                  type="date"
                  value={receiveStockData.expiryDate}
                  onChange={(e) => setReceiveStockData({ ...receiveStockData, expiryDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <div className="flex gap-3 w-full">
                <Button
                  onClick={() => setShowReceiveStock(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReceiveStock}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={loadingOptions}
                >
                  Confirm Receipt
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer to Van Dialog - Updated dropdowns */}
      <Dialog open={showTransferToVan} onOpenChange={setShowTransferToVan}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Transfer Stock to Van
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-product">Product *</Label>
              <select
                id="transfer-product"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={transferData.product_id}
                onChange={(e) => setTransferData({ ...transferData, product_id: e.target.value })}
                required
                disabled={loadingOptions}
              >
                <option value="">Select a product</option>
                {productOptions.map((product) => (
                  <option key={product.product_id} value={product.product_id}>
                    {product.product_name} (Available: {product.available_quantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transfer-quantity">Quantity *</Label>
                <Input
                  id="transfer-quantity"
                  type="number"
                  placeholder="Enter quantity"
                  value={transferData.quantity}
                  onChange={(e) => setTransferData({ ...transferData, quantity: e.target.value })}
                  required
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-batch">Batch No. *</Label>
                <Input
                  id="transfer-batch"
                  type="text"
                  placeholder="Enter batch number"
                  value={transferData.batchNo}
                  onChange={(e) => setTransferData({ ...transferData, batchNo: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="van-select">Select Van *</Label>
              <select
                id="van-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={transferData.to_van_id}
                onChange={(e) => setTransferData({ ...transferData, to_van_id: e.target.value })}
                required
                disabled={loadingOptions}
              >
                <option value="">Select a van</option>
                {vanOptions.map((van) => (
                  <option key={van.van_id} value={van.van_id}>
                    {van.vehicle_number} - {van.assigned_employee}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="mt-6">
              <div className="flex gap-3 w-full">
                <Button
                  onClick={() => setShowTransferToVan(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTransferToVan}
                  className="flex-1 bg-blue-900 hover:bg-blue-800"
                  disabled={loadingOptions}
                >
                  Confirm Transfer
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Product Dialog - Updated to match API */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Box className="w-5 h-5 text-purple-600" />
              Add New Product
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name *</Label>
              <Input
                id="product-name"
                type="text"
                placeholder="e.g., Hand Wash 500ml"
                value={newProductData.product_name}
                onChange={(e) => setNewProductData({ ...newProductData, product_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-code">Product Code *</Label>
              <Input
                id="product-code"
                type="text"
                placeholder="e.g., HW-500"
                value={newProductData.product_code}
                onChange={(e) => setNewProductData({ ...newProductData, product_code: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500">Unique product code/identifier</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-description">Product Description</Label>
              <textarea
                id="product-description"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Enter product description (optional)"
                value={newProductData.product_description}
                onChange={(e) => setNewProductData({ ...newProductData, product_description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-unit-price">Unit Price (LKR) *</Label>
                <Input
                  id="new-unit-price"
                  type="number"
                  placeholder="Enter price"
                  value={newProductData.unit_price}
                  onChange={(e) => setNewProductData({ ...newProductData, unit_price: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="low-stock-threshold">Low Stock Threshold *</Label>
                <Input
                  id="low-stock-threshold"
                  type="number"
                  placeholder="e.g., 10"
                  value={newProductData.low_stock_threshold}
                  onChange={(e) => setNewProductData({ ...newProductData, low_stock_threshold: e.target.value })}
                  required
                  min="1"
                />
                <p className="text-xs text-gray-500">Minimum stock level before alert</p>
              </div>
            </div>

            {/* Hidden manufacturer_id - you might want to add a dropdown for this if you have multiple manufacturers */}
            <input
              type="hidden"
              value={newProductData.manufacturer_id}
            />

            <div className="pt-2">
              <p className="text-xs text-gray-500">
                * Required fields. After adding the product, you can receive stock using the "Receive Stock" option.
              </p>
            </div>

            <DialogFooter className="mt-6">
              <div className="flex gap-3 w-full">
                <Button
                  onClick={() => setShowAddProduct(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddProduct}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Add Product
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}