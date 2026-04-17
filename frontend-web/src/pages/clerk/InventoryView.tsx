// frontend-web/src/pages/clerk/InventoryView.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import productService from "../../services/productService";
import inventoryService from "../../services/inventoryService";
import stockTransferService from "../../services/stockTransferService";
import productApprovalService from "../../services/productApprovalService";
import stockReceiveApprovalService from "../../services/stockReceiveApprovalService";
import { Button } from "../../components/ui/button";
import { Input, Label } from "../../components/ui/form-components";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Plus, Package, Truck, Box, AlertTriangle, Trash2, Save, X } from "lucide-react";
import api from "../../services/api";

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
  location_name?: string;
}

interface AvailableProduct {
  product_id: number;
  product_name: string;
  product_code: string;
  unit_price: number;
  available_quantity?: number;
  total_stock?: number;
  nearest_expiry: string;
}

interface ReceiveItem {
  id: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  quantity: string;
  batch_number: string;
  expiry_date: string;
  unit_price: string;
}

interface TransferItem {
  id: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  quantity: string;
  batch_number: string;
  available_quantity?: number;
}

interface Manufacturer {
  manufacturer_id: number;
  name: string;
}

export default function InventoryView() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productOptions, setProductOptions] = useState<AvailableProduct[]>([]);
  const [vanOptions, setVanOptions] = useState<Van[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // State for dialogs
  const [showReceiveStock, setShowReceiveStock] = useState(false);
  const [showTransferToVan, setShowTransferToVan] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
   
  // State  for multi-item receive
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([]);
  const [receiveRequestData, setReceiveRequestData] = useState({
    manufacturer_id: "",
    purchase_order_reference: "",
    notes: ""
  });
  const [selectedProduct, setSelectedProduct] = useState<AvailableProduct | null>(null);
  
  // State for multi-item transfer
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [transferRequestData, setTransferRequestData] = useState({
    to_van_id: "",
    notes: ""
  });
  const [selectedTransferProduct, setSelectedTransferProduct] = useState<AvailableProduct | null>(null);
  
  // Single item form state (for adding to list)
  const [currentItem, setCurrentItem] = useState({
    product_id: "",
    quantity: "",
    expiryDate: "",
    batch_number: "",
    unit_price: ""
  });

  // Single item form state for transfers
  const [currentTransferItem, setCurrentTransferItem] = useState({
    product_id: "",
    quantity: "",
    batch_number: ""
  });

  // State for Transfer to Van form
  const [transferData, setTransferData] = useState({
    product_id: "",
    quantity: "",
    batchNo: "",
    to_van_id: ""
  });

  // State for Add New Product form
  const [newProductData, setNewProductData] = useState({
    product_name: "",
    product_code: "",
    product_description: "",
    unit_price: "",
    low_stock_threshold: "10",
    manufacturer_id: "1"
  });

  useEffect(() => {
    fetchInventory();
    fetchOptions();
    fetchManufacturers();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await productService.getAllProducts();

      if (response.data.success) {
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

      // Fetch all active products for receive stock dropdown
      const productsResponse = await productService.getAllProducts();
      if (productsResponse.data.success) {
        setProductOptions(productsResponse.data.data);
      }

      const vansResponse = await inventoryService.getVanInventory();
      if (vansResponse.data.success) {
        const vans = vansResponse.data.data.map((van: any) => ({
          van_id: van.van_id,
          vehicle_number: van.vehicle_number,
          assigned_employee: van.assigned_employee,
          location_name: van.location_name
        }));
        setVanOptions(vans);
      }
    } catch (err) {
      console.error('Error fetching options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchManufacturers = async () => {
    try {
      const response = await api.get('/manufacturers');
      if (response.data.success) {
        setManufacturers(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching manufacturers:', err);
    }
  };

  const transformInventoryData = (apiData: any[]): Product[] => {
    return apiData.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      product_code: item.product_code || '-',
      unit_price: item.unit_price,
      store_stock: item.store_stock || 0,
      kiribathgoda_van_stock: 0,
      battaramulla_van_stock: 0,
      homagama_van_stock: 0,
      total_stock: item.total_stock || 0,
      low_stock_threshold: item.low_stock_threshold || 10,
      nearest_expiry: item.nearest_expiry || ''
    }));
  };

  const handleAddReceiveItem = () => {
    if (!selectedProduct || !currentItem.quantity || !currentItem.batch_number || 
        !currentItem.expiryDate || !currentItem.unit_price) {
      alert('Please fill in all item fields');
      return;
    }

    const newItem: ReceiveItem = {
      id: Date.now().toString(),
      product_id: currentItem.product_id,
      product_name: selectedProduct.product_name,
      product_code: selectedProduct.product_code,
      quantity: currentItem.quantity,
      batch_number: currentItem.batch_number,
      expiry_date: currentItem.expiryDate,
      unit_price: currentItem.unit_price
    };

    setReceiveItems([...receiveItems, newItem]);
    
    // Reset current item form
    setCurrentItem({
      product_id: "",
      quantity: "",
      expiryDate: "",
      batch_number: "",
      unit_price: ""
    });
    setSelectedProduct(null);
  };

  const handleRemoveReceiveItem = (id: string) => {
    setReceiveItems(receiveItems.filter(item => item.id !== id));
  };

  const handleAddTransferItem = () => {
    if (!selectedTransferProduct || !currentTransferItem.quantity || !currentTransferItem.batch_number) {
      alert('Please fill in all item fields');
      return;
    }

    const quantity = parseInt(currentTransferItem.quantity);
    const available = selectedTransferProduct.available_quantity || 0;
    
    if (quantity > available) {
      alert(`Cannot transfer ${quantity} units. Only ${available} units available in store.`);
      return;
    }

    const newItem: TransferItem = {
      id: Date.now().toString(),
      product_id: currentTransferItem.product_id,
      product_name: selectedTransferProduct.product_name,
      product_code: selectedTransferProduct.product_code,
      quantity: currentTransferItem.quantity,
      batch_number: currentTransferItem.batch_number,
      available_quantity: available
    };

    setTransferItems([...transferItems, newItem]);
    
    // Reset current transfer item form
    setCurrentTransferItem({
      product_id: "",
      quantity: "",
      batch_number: ""
    });
    setSelectedTransferProduct(null);
  };

  const handleRemoveTransferItem = (id: string) => {
    setTransferItems(transferItems.filter(item => item.id !== id));
  };

  const handleSubmitReceiveRequest = async () => {
    try {
      if (receiveItems.length === 0) {
        alert('Please add at least one item to receive');
        return;
      }

      const payload = {
        manufacturer_id: receiveRequestData.manufacturer_id ? parseInt(receiveRequestData.manufacturer_id) : null,
        purchase_order_reference: receiveRequestData.purchase_order_reference || null,
        notes: receiveRequestData.notes || null,
        items: receiveItems.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          unit_price: parseFloat(item.unit_price)
        }))
      };

      const response = await stockReceiveApprovalService.createReceiveRequest(payload);

      if (response.data.success) {
        alert('Stock receive request submitted successfully! Waiting for admin approval.');
        
        // Reset all forms
        setReceiveItems([]);
        setReceiveRequestData({
          manufacturer_id: "",
          purchase_order_reference: "",
          notes: ""
        });
        setShowReceiveStock(false);
      }
    } catch (err: any) {
      console.error('Error submitting receive request:', err);
      alert(err.response?.data?.message || 'Failed to submit receive request');
    }
  };

  const handleSubmitTransferRequest = async () => {
    try {
      if (transferItems.length === 0) {
        alert('Please add at least one item to transfer');
        return;
      }

      if (!transferRequestData.to_van_id) {
        alert('Please select a van to transfer to');
        return;
      }

      const payload = {
        to_van_id: parseInt(transferRequestData.to_van_id),
        notes: transferRequestData.notes || null,
        items: transferItems.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          batch_number: item.batch_number
        }))
      };

      const response = await stockTransferService.createTransfer(payload);

      if (response.data.success) {
        alert('Stock transfer request submitted successfully! Waiting for admin approval.');
        
        // Reset all forms
        setTransferItems([]);
        setTransferRequestData({
          to_van_id: "",
          notes: ""
        });
        setShowTransferToVan(false);
        
        // Refresh inventory
        fetchInventory();
      }
    } catch (err: any) {
      console.error('Error submitting transfer request:', err);
      alert(err.response?.data?.message || 'Failed to submit transfer request');
    }
  };

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
        setTransferData({
          product_id: "",
          quantity: "",
          batchNo: "",
          to_van_id: ""
        });

        setShowTransferToVan(false);
        fetchInventory();
        fetchOptions();
      }
    } catch (err: any) {
      console.error('Error transferring stock:', err);
      alert(err.response?.data?.message || 'Failed to transfer stock');
    }
  };

  const handleAddProduct = async () => {
    try {
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
        manufacturer_id: parseInt(newProductData.manufacturer_id)
      };

      const response = await productApprovalService.createRequest(payload);

      if (response.data.success) {
        setNewProductData({
          product_name: "",
          product_code: "",
          product_description: "",
          unit_price: "",
          low_stock_threshold: "10",
          manufacturer_id: "1"
        });

        setShowAddProduct(false);

        if (response.data.warning) {
          alert('Product request submitted! Note: ' + response.data.warning);
        } else {
          alert('Product request submitted successfully! An admin will review and approve it.');
        }

        fetchInventory();
        fetchOptions();
      }
    } catch (err: any) {
      console.error('Error submitting product request:', err);
      const errorMessage = err.response?.data?.message || 'Failed to submit product request';
      alert(`Error: ${errorMessage}`);
    }
  };

  const calculateTotalVanStock = () => {
    return 0;
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

      {/* Receive Stock Dialog - Multi-item version */}
      <Dialog open={showReceiveStock} onOpenChange={(open) => {
        setShowReceiveStock(open);
        if (!open) {
          setReceiveItems([]);
          setReceiveRequestData({
            manufacturer_id: "",
            purchase_order_reference: "",
            notes: ""
          });
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              Receive Stock from Manufacturer
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Request Header Information */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Receipt Information</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <select
                    id="manufacturer"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={receiveRequestData.manufacturer_id}
                    onChange={(e) => setReceiveRequestData({ ...receiveRequestData, manufacturer_id: e.target.value })}
                  >
                    <option value="">Select manufacturer (optional)</option>
                    {manufacturers.map((mfr) => (
                      <option key={mfr.manufacturer_id} value={mfr.manufacturer_id}>
                        {mfr.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="po-reference">PO Reference</Label>
                  <Input
                    id="po-reference"
                    type="text"
                    placeholder="e.g., PO-2024-001"
                    value={receiveRequestData.purchase_order_reference}
                    onChange={(e) => setReceiveRequestData({ ...receiveRequestData, purchase_order_reference: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-notes">Notes (Optional)</Label>
                <Textarea
                  id="request-notes"
                  placeholder="Add any notes about this receipt..."
                  value={receiveRequestData.notes}
                  onChange={(e) => setReceiveRequestData({ ...receiveRequestData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            {/* Items List */}
            {receiveItems.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-gray-700">Items to Receive ({receiveItems.length})</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Batch No.</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receiveItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.product_name}
                            <div className="text-xs text-gray-500">{item.product_code}</div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell>{item.batch_number}</TableCell>
                          <TableCell>{new Date(item.expiry_date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">LKR {parseFloat(item.unit_price).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-semibold">
                            LKR {(parseInt(item.quantity) * parseFloat(item.unit_price)).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveReceiveItem(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="text-right font-semibold">
                  Total Value: LKR {receiveItems.reduce((sum, item) => 
                    sum + (parseInt(item.quantity) * parseFloat(item.unit_price)), 0
                  ).toLocaleString()}
                </div>
              </div>
            )}

            {/* Add Item Form */}
            <div className="p-4 border rounded-lg space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Add Item</h4>
              
              <div className="space-y-2">
                <Label htmlFor="product-select">Product *</Label>
                <select
                  id="product-select"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={currentItem.product_id}
                  onChange={(e) => {
                    const productId = e.target.value;
                    const product = productOptions.find(p => p.product_id.toString() === productId);
                    setSelectedProduct(product || null);
                    setCurrentItem({ 
                      ...currentItem, 
                      product_id: productId,
                      unit_price: product ? product.unit_price.toString() : ""
                    });
                  }}
                  disabled={loadingOptions}
                >
                  <option value="">Select a product</option>
                  {productOptions.map((product) => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.product_name} ({product.product_code})
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
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit-price">Unit Price (LKR) *</Label>
                  <Input
                    id="unit-price"
                    type="number"
                    placeholder="Enter price"
                    value={currentItem.unit_price}
                    onChange={(e) => setCurrentItem({ ...currentItem, unit_price: e.target.value })}
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
                    value={currentItem.batch_number}
                    onChange={(e) => setCurrentItem({ ...currentItem, batch_number: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry-date">Expiry Date *</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={currentItem.expiryDate}
                    onChange={(e) => setCurrentItem({ ...currentItem, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <Button
                onClick={handleAddReceiveItem}
                variant="outline"
                className="w-full border-green-600 text-green-600 hover:bg-green-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item to List
              </Button>
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
                  onClick={handleSubmitReceiveRequest}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={receiveItems.length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Submit for Approval
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer to Van Dialog - Multi-item version */}
      <Dialog open={showTransferToVan} onOpenChange={(open) => {
        setShowTransferToVan(open);
        if (!open) {
          setTransferItems([]);
          setTransferRequestData({
            to_van_id: "",
            notes: ""
          });
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Transfer Stock to Van
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Transfer Header Information */}
            <div className="p-4 bg-blue-50 rounded-lg space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Transfer Information</h4>
              
              <div className="space-y-2">
                <Label htmlFor="transfer-van">Select Van Location *</Label>
                <select
                  id="transfer-van"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={transferRequestData.to_van_id}
                  onChange={(e) => setTransferRequestData({ ...transferRequestData, to_van_id: e.target.value })}
                >
                  <option value="">Select a van location</option>
                  {vanOptions.map((van) => (
                    <option key={van.van_id} value={van.van_id}>
                      {van.location_name || `${van.vehicle_number} - ${van.assigned_employee}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-notes">Notes (Optional)</Label>
                <Textarea
                  id="transfer-notes"
                  placeholder="Add any notes about this transfer..."
                  value={transferRequestData.notes}
                  onChange={(e) => setTransferRequestData({ ...transferRequestData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            {/* Items List */}
            {transferItems.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-gray-700">Items to Transfer ({transferItems.length})</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Batch No.</TableHead>
                        <TableHead className="text-right">Available</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transferItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.product_name}
                            <div className="text-xs text-gray-500">{item.product_code}</div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell>{item.batch_number}</TableCell>
                          <TableCell className="text-right">{item.available_quantity}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTransferItem(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Add Item Form */}
            <div className="p-4 border rounded-lg space-y-4">
              <h4 className="font-semibold text-sm text-gray-700">Add Item</h4>
              
              <div className="space-y-2">
                <Label htmlFor="transfer-product-select">Product *</Label>
                <select
                  id="transfer-product-select"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={currentTransferItem.product_id}
                  onChange={(e) => {
                    const productId = e.target.value;
                    const product = productOptions.find(p => p.product_id.toString() === productId);
                    setSelectedTransferProduct(product || null);
                    setCurrentTransferItem({ 
                      ...currentTransferItem, 
                      product_id: productId
                    });
                  }}
                  disabled={loadingOptions}
                >
                  <option value="">Select a product</option>
                  {productOptions.map((product) => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.product_name} ({product.product_code}) - Available: {product.available_quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transfer-item-quantity">Quantity *</Label>
                  <Input
                    id="transfer-item-quantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={currentTransferItem.quantity}
                    onChange={(e) => setCurrentTransferItem({ ...currentTransferItem, quantity: e.target.value })}
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfer-item-batch">Batch No. *</Label>
                  <Input
                    id="transfer-item-batch"
                    type="text"
                    placeholder="Enter batch number"
                    value={currentTransferItem.batch_number}
                    onChange={(e) => setCurrentTransferItem({ ...currentTransferItem, batch_number: e.target.value })}
                  />
                </div>
              </div>

              <Button
                onClick={handleAddTransferItem}
                variant="outline"
                className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item to Transfer List
              </Button>
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
                  onClick={handleSubmitTransferRequest}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={transferItems.length === 0 || !transferRequestData.to_van_id}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Submit for Approval
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

            <div className="space-y-2">
              <Label htmlFor="manufacturer-select">Manufacturer *</Label>
              <select
                id="manufacturer-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newProductData.manufacturer_id}
                onChange={(e) => setNewProductData({ ...newProductData, manufacturer_id: e.target.value })}
                required
              >
                <option value="">Select manufacturer</option>
                {manufacturers.map((mfr) => (
                  <option key={mfr.manufacturer_id} value={mfr.manufacturer_id}>
                    {mfr.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <p className="text-xs text-gray-500">
                * Required fields. Product will be submitted for admin approval.
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
                  Submit for Approval
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}