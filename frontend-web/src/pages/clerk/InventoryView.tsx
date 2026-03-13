// frontend-web/src/pages/clerk/InventoryView.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import productService from "../../services/productService";
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

export default function InventoryView() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for dialogs
  const [showReceiveStock, setShowReceiveStock] = useState(false);
  const [showTransferToVan, setShowTransferToVan] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // State for Receive Stock form
  const [receiveStockData, setReceiveStockData] = useState({
    product: "",
    quantity: "",
    expiryDate: "",
    batchNo: "",
    unitPrice: ""
  });

  // State for Transfer to Van form
  const [transferData, setTransferData] = useState({
    product: "",
    quantity: "",
    batchNo: "",
    van: ""
  });

  // State for Add New Product form
  const [newProductData, setNewProductData] = useState({
    productName: "",
    unitPrice: "",
    batchNo: "",
    expiryDate: "",
    quantity: ""
  });

  // Product options for dropdowns
  const productOptions = [
    "Hand Wash 500ml",
    "Shampoo 100ml",
    "Body Wash 500ml",
    "Amla Shampoo 250ml",
    "Face Wash 100ml",
    "Hair Oil 200ml"
  ];

  // Van options for dropdown
  const vanOptions = [
    "Van-Kiribathgoda",
    "Van-Battaramulla", 
    "Van-Homagama"
  ];

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

  // Handle Receive Stock form submission
  const handleReceiveStock = () => {
    // TODO: Call API to receive stock
    console.log("Receive Stock Data:", receiveStockData);
    
    // Reset form
    setReceiveStockData({
      product: "",
      quantity: "",
      expiryDate: "",
      batchNo: "",
      unitPrice: ""
    });
    
    // Close dialog and refresh inventory
    setShowReceiveStock(false);
    fetchInventory();
  };

  // Handle Transfer to Van form submission
  const handleTransferToVan = () => {
    // TODO: Call API to transfer stock to van
    console.log("Transfer Data:", transferData);
    
    // Reset form
    setTransferData({
      product: "",
      quantity: "",
      batchNo: "",
      van: ""
    });
    
    // Close dialog and refresh inventory
    setShowTransferToVan(false);
    fetchInventory();
  };

  // Handle Add New Product form submission
  const handleAddProduct = () => {
    // TODO: Call API to add new product
    console.log("New Product Data:", newProductData);
    
    // Reset form
    setNewProductData({
      productName: "",
      unitPrice: "",
      batchNo: "",
      expiryDate: "",
      quantity: ""
    });
    
    // Close dialog and refresh inventory
    setShowAddProduct(false);
    fetchInventory();
  };

  // Calculate total van stock for each location
  const calculateTotalKiribathgodaStock = () => {
    return inventory.reduce((sum, item) => sum + (item.kiribathgoda_van_stock || 0), 0);
  };

  const calculateTotalBattaramullaStock = () => {
    return inventory.reduce((sum, item) => sum + (item.battaramulla_van_stock || 0), 0);
  };

  const calculateTotalHomagamaStock = () => {
    return inventory.reduce((sum, item) => sum + (item.homagama_van_stock || 0), 0);
  };

  const calculateTotalVanStock = () => {
    return calculateTotalKiribathgodaStock() + calculateTotalBattaramullaStock() + calculateTotalHomagamaStock();
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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

      {/* Action Buttons Card */}
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
                    const totalVanStock = (item.kiribathgoda_van_stock || 0) + 
                                          (item.battaramulla_van_stock || 0) + 
                                          (item.homagama_van_stock || 0);
                    
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

      {/* Receive Stock Dialog */}
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
                value={receiveStockData.product}
                onChange={(e) => setReceiveStockData({...receiveStockData, product: e.target.value})}
                required
              >
                <option value="">Select a product</option>
                {productOptions.map((product, index) => (
                  <option key={index} value={product}>{product}</option>
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
                  onChange={(e) => setReceiveStockData({...receiveStockData, quantity: e.target.value})}
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
                  value={receiveStockData.unitPrice}
                  onChange={(e) => setReceiveStockData({...receiveStockData, unitPrice: e.target.value})}
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
                  value={receiveStockData.batchNo}
                  onChange={(e) => setReceiveStockData({...receiveStockData, batchNo: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiry-date">Expiry Date *</Label>
                <Input 
                  id="expiry-date"
                  type="date" 
                  value={receiveStockData.expiryDate}
                  onChange={(e) => setReceiveStockData({...receiveStockData, expiryDate: e.target.value})}
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
                >
                  Confirm Receipt
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer to Van Dialog */}
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
                value={transferData.product}
                onChange={(e) => setTransferData({...transferData, product: e.target.value})}
                required
              >
                <option value="">Select a product</option>
                {productOptions.map((product, index) => (
                  <option key={index} value={product}>{product}</option>
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
                  onChange={(e) => setTransferData({...transferData, quantity: e.target.value})}
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
                  onChange={(e) => setTransferData({...transferData, batchNo: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="van-select">Select Van *</Label>
              <select 
                id="van-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={transferData.van}
                onChange={(e) => setTransferData({...transferData, van: e.target.value})}
                required
              >
                <option value="">Select a van</option>
                {vanOptions.map((van, index) => (
                  <option key={index} value={van}>{van}</option>
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
                >
                  Confirm Transfer
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add New Product Dialog */}
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
                value={newProductData.productName}
                onChange={(e) => setNewProductData({...newProductData, productName: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-unit-price">Unit Price (LKR) *</Label>
                <Input 
                  id="new-unit-price"
                  type="number" 
                  placeholder="Enter price"
                  value={newProductData.unitPrice}
                  onChange={(e) => setNewProductData({...newProductData, unitPrice: e.target.value})}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-batch-no">Batch No. *</Label>
                <Input 
                  id="new-batch-no"
                  type="text" 
                  placeholder="Enter batch number"
                  value={newProductData.batchNo}
                  onChange={(e) => setNewProductData({...newProductData, batchNo: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-expiry-date">Expiry Date *</Label>
                <Input 
                  id="new-expiry-date"
                  type="date" 
                  value={newProductData.expiryDate}
                  onChange={(e) => setNewProductData({...newProductData, expiryDate: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-quantity">Initial Quantity *</Label>
                <Input 
                  id="new-quantity"
                  type="number" 
                  placeholder="Enter quantity"
                  value={newProductData.quantity}
                  onChange={(e) => setNewProductData({...newProductData, quantity: e.target.value})}
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-gray-500">
                * All fields are required. The product will be added to the system inventory immediately.
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