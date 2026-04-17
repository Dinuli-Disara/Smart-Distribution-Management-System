// frontend-web/src/pages/Owner/InventoryView.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import productService from "../../services/productService";
import productApprovalService from "../../services/productApprovalService";
import stockReceiveApprovalService from "../../services/stockReceiveApprovalService";
import stockTransferService from "../../services/stockTransferService";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/form-components";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Package, Truck, Box, AlertTriangle, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
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

interface ReceiveRequest {
  receive_request_id: number;
  manufacturer_id: number | null;
  manufacturer_name: string | null;
  purchase_order_reference: string | null;
  requested_by: number;
  requested_by_name: string;
  requested_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  days_pending: number;
  item_count: number;
  total_quantity: number;
}

interface TransferRequest {
  transfer_id: number;
  transferred_by: number;
  transferred_by_name: string;
  from_location_id: number;
  from_location_name: string;
  to_location_id: number;
  to_location_name: string;
  transfer_date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  days_pending: number;
  item_count: number;
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

  // Receive requests state
  const [pendingReceiveRequests, setPendingReceiveRequests] = useState<ReceiveRequest[]>([]);
  const [allReceiveRequests, setAllReceiveRequests] = useState<ReceiveRequest[]>([]);
  const [loadingReceiveRequests, setLoadingReceiveRequests] = useState(false);
  const [selectedReceiveRequest, setSelectedReceiveRequest] = useState<any>(null);
  const [showReceiveRequestDetails, setShowReceiveRequestDetails] = useState(false);
  const [receiveReviewNotes, setReceiveReviewNotes] = useState('');

  // Transfer requests state
  const [pendingTransferRequests, setPendingTransferRequests] = useState<TransferRequest[]>([]);
  const [allTransferRequests, setAllTransferRequests] = useState<TransferRequest[]>([]);
  const [loadingTransferRequests, setLoadingTransferRequests] = useState(false);
  const [selectedTransferRequest, setSelectedTransferRequest] = useState<any>(null);
  const [showTransferRequestDetails, setShowTransferRequestDetails] = useState(false);
  const [transferReviewNotes, setTransferReviewNotes] = useState('');

  // Calculate statistics
  const lowStockCount = inventory.filter(item => item.total_stock < item.low_stock_threshold).length;
  const totalProducts = inventory.length;
  const totalValue = inventory.reduce((sum, item) => sum + (item.total_stock * item.unit_price), 0);
  const pendingRequestsCount = pendingRequests.length;
  const pendingReceiveCount = pendingReceiveRequests.length;
  const pendingTransferCount = pendingTransferRequests.length;

  useEffect(() => {
    fetchInventory();
    fetchPendingRequests();
    fetchPendingReceiveRequests();
    fetchPendingTransferRequests();
  }, []);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchAllRequests();
    } else if (activeTab === 'receives') {
      fetchAllReceiveRequests();
    } else if (activeTab === 'transfers') {
      fetchAllTransferRequests();
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
      const response = await productApprovalService.getPendingRequests();
      if (response.data.success) {
        setPendingRequests(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
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

  const fetchPendingReceiveRequests = async () => {
    try {
      const response = await stockReceiveApprovalService.getPendingReceiveRequests();
      if (response.data.success) {
        setPendingReceiveRequests(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching pending receive requests:', err);
    }
  };

  const fetchAllReceiveRequests = async () => {
    try {
      setLoadingReceiveRequests(true);
      const response = await stockReceiveApprovalService.getAllReceiveRequests();
      if (response.data.success) {
        setAllReceiveRequests(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching all receive requests:', err);
    } finally {
      setLoadingReceiveRequests(false);
    }
  };

  const fetchReceiveRequestDetails = async (id: number) => {
    try {
      const response = await stockReceiveApprovalService.getReceiveRequest(id);
      if (response.data.success) {
        setSelectedReceiveRequest(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching receive request details:', err);
    }
  };

  const fetchPendingTransferRequests = async () => {
    try {
      const response = await stockTransferService.getPendingTransfers();
      if (response.data.success) {
        setPendingTransferRequests(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching pending transfer requests:', err);
    }
  };

  const fetchAllTransferRequests = async () => {
    try {
      setLoadingTransferRequests(true);
      const response = await stockTransferService.getAllTransfers();
      if (response.data.success) {
        setAllTransferRequests(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching all transfer requests:', err);
    } finally {
      setLoadingTransferRequests(false);
    }
  };

  const fetchTransferRequestDetails = async (id: number) => {
    try {
      const response = await stockTransferService.getTransfer(id);
      if (response.data.success) {
        setSelectedTransferRequest(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching transfer request details:', err);
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
        fetchInventory();
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

  const handleApproveReceiveRequest = async (requestId: number) => {
    if (!selectedReceiveRequest?.items || selectedReceiveRequest.items.length === 0) {
      alert('Cannot approve a request with no items.');
      return;
    }

    try {
      const payload: any = {
        notes: receiveReviewNotes || undefined,
        items: selectedReceiveRequest.items.map((item: any) => ({
          product_id: item.product_id,
          quantity: Number(item.quantity),
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          unit_price: Number(item.unit_price)
        }))
      };

      const response = await stockReceiveApprovalService.approveReceiveRequest(requestId, payload);

      if (response.data.success) {
        alert(`Stock receive request approved! ${response.data.data.items_processed} items added to inventory.`);
        setShowReceiveRequestDetails(false);
        setSelectedReceiveRequest(null);
        setReceiveReviewNotes('');
        fetchPendingReceiveRequests();
        fetchAllReceiveRequests();
        fetchInventory();
      }
    } catch (err: any) {
      console.error('Error approving receive request:', err);
      alert(err.response?.data?.message || 'Failed to approve receive request');
    }
  };

  const handleRejectReceiveRequest = async (requestId: number) => {
    if (!receiveReviewNotes) {
      alert('Please provide a reason for rejection.');
      return;
    }

    try {
      const response = await stockReceiveApprovalService.rejectReceiveRequest(
        requestId,
        receiveReviewNotes
      );

      if (response.data.success) {
        alert('Stock receive request has been rejected.');
        setShowReceiveRequestDetails(false);
        setSelectedReceiveRequest(null);
        setReceiveReviewNotes('');
        fetchPendingReceiveRequests();
        fetchAllReceiveRequests();
      }
    } catch (err: any) {
      console.error('Error rejecting receive request:', err);
      alert(err.response?.data?.message || 'Failed to reject receive request');
    }
  };

  const handleUpdateReceiveRequestItem = (itemId: number, field: string, value: string | number) => {
    setSelectedReceiveRequest((prev: any) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((item: any) =>
        item.item_id === itemId ? { ...item, [field]: value } : item
      );
      return { ...prev, items: updatedItems };
    });
  };

  const handleApproveTransferRequest = async (requestId: number) => {
    try {
      const response = await stockTransferService.approveTransfer(requestId, transferReviewNotes || undefined);

      if (response.data.success) {
        alert('Stock transfer request approved! Stock has been transferred.');
        setShowTransferRequestDetails(false);
        setSelectedTransferRequest(null);
        setTransferReviewNotes('');
        fetchPendingTransferRequests();
        fetchAllTransferRequests();
        fetchInventory();
      }
    } catch (err: any) {
      console.error('Error approving transfer request:', err);
      alert(err.response?.data?.message || 'Failed to approve transfer request');
    }
  };

  const handleRejectTransferRequest = async (requestId: number) => {
    if (!transferReviewNotes) {
      alert('Please provide a reason for rejection.');
      return;
    }

    try {
      const response = await stockTransferService.rejectTransfer(requestId, transferReviewNotes);

      if (response.data.success) {
        alert('Stock transfer request has been rejected.');
        setShowTransferRequestDetails(false);
        setSelectedTransferRequest(null);
        setTransferReviewNotes('');
        fetchPendingTransferRequests();
        fetchAllTransferRequests();
      }
    } catch (err: any) {
      console.error('Error rejecting transfer request:', err);
      alert(err.response?.data?.message || 'Failed to reject transfer request');
    }
  };

  const handleRemoveReceiveRequestItem = (itemId: number) => {
    setSelectedReceiveRequest((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter((item: any) => item.item_id !== itemId)
      };
    });
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
                <p className="text-sm text-gray-600 mb-1">Pending Products</p>
                <h3 className="text-2xl font-bold text-orange-600">{pendingRequestsCount}</h3>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('receives')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Receives</p>
                <h3 className="text-2xl font-bold text-blue-600">{pendingReceiveCount}</h3>
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
      </div>

      {/* Action Buttons Card */}
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
              onClick={() => setActiveTab('receives')}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Package className="w-4 h-4 mr-2" />
              Receive Requests {pendingReceiveCount > 0 && `(${pendingReceiveCount})`}
            </Button>
            <Button
              onClick={() => setActiveTab('transfers')}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <Truck className="w-4 h-4 mr-2" />
              Transfer Requests {pendingTransferCount > 0 && `(${pendingTransferCount})`}
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
          <TabsTrigger value="receives">
            Receive Requests
            {pendingReceiveCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                {pendingReceiveCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="transfers">
            Transfer Requests
            {pendingTransferCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                {pendingTransferCount}
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

        <TabsContent value="receives" className="space-y-4">
          {/* Receive Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Stock Receive Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingReceiveRequests && (
                <div className="p-4 text-center text-gray-600">
                  Loading receive requests...
                </div>
              )}
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pending">
                    Pending
                    {pendingReceiveCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 rounded-full">
                        {pendingReceiveCount}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>

                {['pending', 'approved', 'rejected'].map((status) => (
                  <TabsContent key={status} value={status} className="mt-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Manufacturer</TableHead>
                            <TableHead>PO Reference</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total Qty</TableHead>
                            <TableHead>Requested By</TableHead>
                            <TableHead>Requested On</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allReceiveRequests
                            .filter(r => r.status.toLowerCase() === status)
                            .map((request) => (
                              <TableRow key={request.receive_request_id}>
                                <TableCell className="font-medium">
                                  #{request.receive_request_id}
                                </TableCell>
                                <TableCell>{request.manufacturer_name || '-'}</TableCell>
                                <TableCell>{request.purchase_order_reference || '-'}</TableCell>
                                <TableCell>{request.item_count} items</TableCell>
                                <TableCell>{request.total_quantity}</TableCell>
                                <TableCell>{request.requested_by_name}</TableCell>
                                <TableCell>
                                  {new Date(request.requested_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      await fetchReceiveRequestDetails(request.receive_request_id);
                                      setReceiveReviewNotes('');
                                      setShowReceiveRequestDetails(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          {allReceiveRequests.filter(r => r.status.toLowerCase() === status).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                                No {status} receive requests found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          {/* Transfer Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Stock Transfer Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTransferRequests && (
                <div className="p-4 text-center text-gray-600">
                  Loading transfer requests...
                </div>
              )}
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pending">
                    Pending
                    {pendingTransferCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 rounded-full">
                        {pendingTransferCount}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>

                {['pending', 'approved', 'rejected'].map((status) => (
                  <TabsContent key={status} value={status} className="mt-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Requested By</TableHead>
                            <TableHead>Requested On</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allTransferRequests
                            .filter(r => r.status.toLowerCase() === status)
                            .map((request) => (
                              <TableRow key={request.transfer_id}>
                                <TableCell className="font-medium">
                                  #{request.transfer_id}
                                </TableCell>
                                <TableCell>{request.from_location_name}</TableCell>
                                <TableCell>{request.to_location_name}</TableCell>
                                <TableCell>{request.item_count} items</TableCell>
                                <TableCell>{request.transferred_by_name}</TableCell>
                                <TableCell>
                                  {new Date(request.transfer_date).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      await fetchTransferRequestDetails(request.transfer_id);
                                      setTransferReviewNotes('');
                                      setShowTransferRequestDetails(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          {allTransferRequests.filter(r => r.status.toLowerCase() === status).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                                No {status} transfer requests found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Request Details Dialog */}
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

      {/* Receive Request Details Dialog */}
      <Dialog open={showReceiveRequestDetails} onOpenChange={setShowReceiveRequestDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Receive Request Details #{selectedReceiveRequest?.receive_request_id}
            </DialogTitle>
          </DialogHeader>

          {selectedReceiveRequest && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Manufacturer</p>
                  <p className="font-semibold">{selectedReceiveRequest.manufacturer_name || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">PO Reference</p>
                  <p className="font-semibold">{selectedReceiveRequest.purchase_order_reference || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requested By</p>
                  <p className="font-semibold">{selectedReceiveRequest.requested_by_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requested On</p>
                  <p className="font-semibold">
                    {new Date(selectedReceiveRequest.requested_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedReceiveRequest.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="font-semibold">{selectedReceiveRequest.items?.length || 0} items</p>
                </div>
                {selectedReceiveRequest.review_notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="font-semibold">{selectedReceiveRequest.review_notes}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-3">Items to Receive</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Batch No.</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReceiveRequest.items?.map((item: any) => (
                        <TableRow key={item.item_id}>
                          <TableCell className="font-medium">
                            {item.product_name}
                            <div className="text-xs text-gray-500">{item.product_code}</div>
                          </TableCell>
                          {selectedReceiveRequest.status === 'PENDING' ? (
                            <>
                              <TableCell className="text-right">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateReceiveRequestItem(item.item_id, 'quantity', Number(e.target.value))}
                                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm text-right"
                                />
                              </TableCell>
                              <TableCell>
                                <input
                                  type="text"
                                  value={item.batch_number}
                                  onChange={(e) => handleUpdateReceiveRequestItem(item.item_id, 'batch_number', e.target.value)}
                                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                                />
                              </TableCell>
                              <TableCell>
                                <input
                                  type="date"
                                  value={item.expiry_date.slice(0, 10)}
                                  onChange={(e) => handleUpdateReceiveRequestItem(item.item_id, 'expiry_date', e.target.value)}
                                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unit_price}
                                  onChange={(e) => handleUpdateReceiveRequestItem(item.item_id, 'unit_price', Number(e.target.value))}
                                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm text-right"
                                />
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                LKR {(Number(item.quantity) * Number(item.unit_price)).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveReceiveRequestItem(item.item_id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell>{item.batch_number}</TableCell>
                              <TableCell>{new Date(item.expiry_date).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">LKR {item.unit_price.toLocaleString()}</TableCell>
                              <TableCell className="text-right font-semibold">
                                LKR {(item.quantity * item.unit_price).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-center">-</TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-3 text-right">
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-xl font-bold text-green-600">
                    LKR {selectedReceiveRequest.items?.reduce((sum: number, item: any) =>
                      sum + (item.quantity * item.unit_price), 0
                    ).toLocaleString()}
                  </p>
                </div>
              </div>

              {selectedReceiveRequest.status !== 'PENDING' && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Review Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Reviewed By</p>
                      <p className="font-semibold">{selectedReceiveRequest.reviewed_by_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Reviewed On</p>
                      <p className="font-semibold">
                        {selectedReceiveRequest.reviewed_at ?
                          new Date(selectedReceiveRequest.reviewed_at).toLocaleString() : '-'}
                      </p>
                    </div>
                    {selectedReceiveRequest.review_notes && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Review Notes</p>
                        <p className="font-semibold">{selectedReceiveRequest.review_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedReceiveRequest.status === 'PENDING' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="receive-review-notes">Review Notes</Label>
                    <Textarea
                      id="receive-review-notes"
                      placeholder="Add notes (required for rejection)"
                      value={receiveReviewNotes}
                      onChange={(e) => setReceiveReviewNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApproveReceiveRequest(selectedReceiveRequest.receive_request_id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Receipt
                    </Button>
                    <Button
                      onClick={() => handleRejectReceiveRequest(selectedReceiveRequest.receive_request_id)}
                      variant="outline"
                      className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Receipt
                    </Button>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  onClick={() => setShowReceiveRequestDetails(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Request Details Dialog */}
      <Dialog open={showTransferRequestDetails} onOpenChange={setShowTransferRequestDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Transfer Request Details #{selectedTransferRequest?.transfer_id}
            </DialogTitle>
          </DialogHeader>

          {selectedTransferRequest && (
            <div className="space-y-6 mt-4">
              {/* Transfer Information */}
              <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                <h4 className="font-semibold text-sm text-gray-700">Transfer Information</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">From Location</p>
                    <p className="font-semibold">{selectedTransferRequest.from_location_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">To Location</p>
                    <p className="font-semibold">{selectedTransferRequest.to_location_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Requested By</p>
                    <p className="font-semibold">{selectedTransferRequest.transferred_by_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Requested On</p>
                    <p className="font-semibold">
                      {new Date(selectedTransferRequest.transfer_date).toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedTransferRequest.notes && (
                  <div>
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="text-sm bg-white p-2 rounded border">{selectedTransferRequest.notes}</p>
                  </div>
                )}
              </div>

              {/* Transfer Items */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-gray-700">Transfer Items ({selectedTransferRequest.items?.length || 0})</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Batch No.</TableHead>
                        <TableHead>Expiry Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedTransferRequest.items?.map((item: any) => (
                        <TableRow key={item.transfer_item_id}>
                          <TableCell className="font-medium">
                            {item.product_name}
                            <div className="text-xs text-gray-500">{item.product_code}</div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity_to_transfer}</TableCell>
                          <TableCell>{item.batch_number || '-'}</TableCell>
                          <TableCell>
                            {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Review Section - Only for pending requests */}
              {selectedTransferRequest.status === 'PENDING' && (
                <div className="p-4 border rounded-lg space-y-4">
                  <h4 className="font-semibold text-sm text-gray-700">Review Decision</h4>

                  <div className="space-y-2">
                    <Label htmlFor="transfer-review-notes">Review Notes</Label>
                    <Textarea
                      id="transfer-review-notes"
                      placeholder="Add approval notes or reason for rejection..."
                      value={transferReviewNotes}
                      onChange={(e) => setTransferReviewNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApproveTransferRequest(selectedTransferRequest.transfer_id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Transfer
                    </Button>
                    <Button
                      onClick={() => handleRejectTransferRequest(selectedTransferRequest.transfer_id)}
                      variant="outline"
                      className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Transfer
                    </Button>
                  </div>
                </div>
              )}

              {/* Status Information - For approved/rejected requests */}
              {selectedTransferRequest.status !== 'PENDING' && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <h4 className="font-semibold text-sm text-gray-700">Review Information</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge variant={selectedTransferRequest.status === 'APPROVED' ? 'default' : 'destructive'}>
                        {selectedTransferRequest.status}
                      </Badge>
                    </div>
                    {selectedTransferRequest.reviewed_by_name && (
                      <div>
                        <p className="text-sm text-gray-600">Reviewed By</p>
                        <p className="font-semibold">{selectedTransferRequest.reviewed_by_name}</p>
                      </div>
                    )}
                  </div>

                  {selectedTransferRequest.reviewed_at && (
                    <div>
                      <p className="text-sm text-gray-600">Reviewed On</p>
                      <p className="font-semibold">
                        {new Date(selectedTransferRequest.reviewed_at).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedTransferRequest.review_notes && (
                    <div>
                      <p className="text-sm text-gray-600">Review Notes</p>
                      <p className="text-sm bg-white p-2 rounded border">{selectedTransferRequest.review_notes}</p>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button
                  onClick={() => setShowTransferRequestDetails(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}