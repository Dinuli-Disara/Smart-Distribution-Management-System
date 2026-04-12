// frontend-web/src/pages/Owner/InventoryView.tsx
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
import { Package, Truck, Box, AlertTriangle, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs.tsx";
import { Textarea } from "../../components/ui/textarea";

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

interface ProductApprovalRequest {
  request_id: number;
  product_name: string;
  product_code: string;
  product_description: string;
  unit_price: number;
  low_stock_threshold: number;
  manufacturer_id: number;
  manufacturer_name: string;
  requested_by: number;
  requested_by_name: string;
  requested_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  days_pending: number;
}

interface StockTransferRequest {
  transfer_id: number;
  from_location_name: string;
  to_van_id: number;
  vehicle_number: string;
  requested_by_name: string;
  requested_at: string;
  status: string;
  items: any[];
}

export default function InventoryView() {
  const [inventory, setInventory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('inventory');

  // Product approval requests state
  const [pendingRequests, setPendingRequests] = useState<ProductApprovalRequest[]>([]);
  const [allRequests, setAllRequests] = useState<ProductApprovalRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProductApprovalRequest | null>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  // State for dialogs
  const [showTransferConfirmations, setShowTransferConfirmations] = useState(false);
  const [showReceiveConfirmations, setShowReceiveConfirmations] = useState(false);

  // Calculate statistics
  const lowStockCount = inventory.filter(item => item.total_stock < item.low_stock_threshold).length;
  const totalProducts = inventory.length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.total_stock * item.unit_price), 0);
  const pendingRequestsCount = pendingRequests.length;

  useEffect(() => {
    fetchInventory();
    fetchPendingRequests();
  }, []);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchAllRequests();
    }
  }, [activeTab]);

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

  const fetchPendingRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await productApprovalService.getPendingRequests();
      if (response.data.success) {
        setPendingRequests(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchAllRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await productApprovalService.getAllRequests();
      if (response.data.success) {
        setAllRequests(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching all requests:', err);
    } finally {
      setLoadingRequests(false);
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

  const handleApproveRequest = async (requestId: number) => {
    try {
      const response = await productApprovalService.approveRequest(requestId, reviewNotes || undefined);
      
      if (response.data.success) {
        alert(`Product "${response.data.data.product.product_name}" has been approved and added to inventory!`);
        setShowRequestDetails(false);
        setSelectedRequest(null);
        setReviewNotes('');
        fetchPendingRequests();
        fetchAllRequests();
        fetchInventory(); // Refresh inventory to show new product
      }
    } catch (err: any) {
      console.error('Error approving request:', err);
      alert(err.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    if (!reviewNotes) {
      alert('Please provide a reason for rejection in the notes.');
      return;
    }

    try {
      const response = await productApprovalService.rejectRequest(requestId, reviewNotes);
      
      if (response.data.success) {
        alert('Product request has been rejected.');
        setShowRequestDetails(false);
        setSelectedRequest(null);
        setReviewNotes('');
        fetchPendingRequests();
        fetchAllRequests();
      }
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      alert(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const calculateTotalVanStock = () => {
    return 0; // Implement based on your data structure
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
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

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('requests')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Approvals</p>
                <h3 className="text-2xl font-bold text-orange-600">{pendingRequestsCount}</h3>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Inventory Value</p>
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

      {/* Action Buttons Card - Admin specific */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Admin Actions</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => setActiveTab('requests')}
              variant="outline"
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <Clock className="w-4 h-4 mr-2" />
              Product Requests {pendingRequestsCount > 0 && `(${pendingRequestsCount})`}
            </Button>
            <Button
              onClick={() => setShowTransferConfirmations(true)}
              variant="outline"
              className="border-blue-900 text-blue-900 hover:bg-blue-50"
            >
              <Truck className="w-4 h-4 mr-2" />
              Transfer Confirmations
            </Button>
            <Button
              onClick={() => setShowReceiveConfirmations(true)}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Package className="w-4 h-4 mr-2" />
              Receive Confirmations
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="requests">
            Product Requests
            {pendingRequestsCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                {pendingRequestsCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
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
                          No products found.
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
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {/* Product Approval Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Product Approval Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRequests ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Product Code</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead>Manufacturer</TableHead>
                        <TableHead>Requested By</TableHead>
                        <TableHead>Requested On</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                            No product requests found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        allRequests.map((request) => (
                          <TableRow key={request.request_id}>
                            <TableCell className="font-medium">{request.product_name}</TableCell>
                            <TableCell>{request.product_code || '-'}</TableCell>
                            <TableCell className="text-right">
                              LKR {request.unit_price.toLocaleString()}
                            </TableCell>
                            <TableCell>{request.manufacturer_name}</TableCell>
                            <TableCell>{request.requested_by_name}</TableCell>
                            <TableCell>
                              {new Date(request.requested_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setReviewNotes('');
                                  setShowRequestDetails(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Details Dialog */}
      <Dialog open={showRequestDetails} onOpenChange={setShowRequestDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Box className="w-5 h-5" />
              Product Request Details
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 mt-4">
              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Product Name</p>
                  <p className="font-semibold">{selectedRequest.product_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Product Code</p>
                  <p className="font-semibold">{selectedRequest.product_code || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unit Price</p>
                  <p className="font-semibold">LKR {selectedRequest.unit_price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Low Stock Threshold</p>
                  <p className="font-semibold">{selectedRequest.low_stock_threshold}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="font-semibold">{selectedRequest.product_description || 'No description provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Manufacturer</p>
                  <p className="font-semibold">{selectedRequest.manufacturer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requested By</p>
                  <p className="font-semibold">{selectedRequest.requested_by_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requested On</p>
                  <p className="font-semibold">
                    {new Date(selectedRequest.requested_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              {/* Review Info (if already reviewed) */}
              {selectedRequest.status !== 'PENDING' && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Review Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Reviewed By</p>
                      <p className="font-semibold">{selectedRequest.reviewed_by_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Reviewed On</p>
                      <p className="font-semibold">
                        {selectedRequest.reviewed_at ? new Date(selectedRequest.reviewed_at).toLocaleString() : '-'}
                      </p>
                    </div>
                    {selectedRequest.review_notes && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Review Notes</p>
                        <p className="font-semibold">{selectedRequest.review_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Review Actions (only for pending requests) */}
              {selectedRequest.status === 'PENDING' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="review-notes">Review Notes</Label>
                    <Textarea
                      id="review-notes"
                      placeholder="Add notes (required for rejection)"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApproveRequest(selectedRequest.request_id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Request
                    </Button>
                    <Button
                      onClick={() => handleRejectRequest(selectedRequest.request_id)}
                      variant="outline"
                      className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Request
                    </Button>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  onClick={() => setShowRequestDetails(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Confirmations Dialog (Placeholder) */}
      <Dialog open={showTransferConfirmations} onOpenChange={setShowTransferConfirmations}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Transfer Confirmations
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-gray-500">
            <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Transfer confirmation feature coming soon.</p>
            <p className="text-sm mt-2">This will show pending stock transfers that need admin approval.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTransferConfirmations(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Confirmations Dialog (Placeholder) */}
      <Dialog open={showReceiveConfirmations} onOpenChange={setShowReceiveConfirmations}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              Receive Confirmations
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Receive confirmation feature coming soon.</p>
            <p className="text-sm mt-2">This will show pending stock receipts that need admin verification.</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowReceiveConfirmations(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}