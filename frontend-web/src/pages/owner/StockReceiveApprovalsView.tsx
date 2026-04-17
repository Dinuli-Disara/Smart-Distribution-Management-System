// frontend-web/src/pages/owner/StockReceiveApprovalsView.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input, Label } from "../../components/ui/form-components";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { CheckCircle, XCircle, Eye, Calendar } from "lucide-react";
import stockReceiveApprovalService from "../../services/stockReceiveApprovalService";

interface ReceiveItem {
  item_id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  batch_number: string;
  expiry_date: string;
  unit_price: number;
}

interface ReceiveRequest {
  receive_request_id: number;
  manufacturer_name: string;
  requested_by_name: string;
  purchase_order_reference: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_at: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  item_count?: number;
  total_quantity?: number;
  items?: ReceiveItem[];
}

export default function StockReceiveApprovalsView() {
  const [requests, setRequests] = useState<ReceiveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ReceiveRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const response = await stockReceiveApprovalService.getAllReceiveRequests(statusFilter !== 'ALL' ? statusFilter : undefined);

      if (response.data.success) {
        setRequests(response.data.data);
      } else {
        setError('Failed to fetch requests');
      }
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      setError(err.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (request: ReceiveRequest) => {
    try {
      const response = await stockReceiveApprovalService.getReceiveRequest(request.receive_request_id);
      if (response.data.success) {
        setSelectedRequest(response.data.data);
        setShowDetails(true);
      }
    } catch (err) {
      console.error('Error fetching request details:', err);
      alert('Failed to load request details');
    }
  };

  const handleApproveClick = (request: ReceiveRequest) => {
    setApprovingId(request.receive_request_id);
    setApprovalNotes('');
    setShowApprovalDialog(true);
  };

  const handleApprove = async () => {
    if (!approvingId) return;

    try {
      const response = await stockReceiveApprovalService.approveReceiveRequest(approvingId, approvalNotes || undefined);
      if (response.data.success) {
        alert('Stock receive request approved successfully!');
        setShowApprovalDialog(false);
        setApprovingId(null);
        setApprovalNotes('');
        fetchRequests();
      }
    } catch (err: any) {
      console.error('Error approving request:', err);
      alert(err.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId: number) => {
    const notes = prompt('Enter rejection reason (optional):');
    if (notes === null) return; // User clicked cancel

    try {
      const response = await stockReceiveApprovalService.rejectReceiveRequest(requestId, notes || undefined);
      if (response.data.success) {
        alert('Stock receive request rejected');
        fetchRequests();
      }
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      alert(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stock receive requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Stock Receive Approvals</h1>
        <p className="text-gray-600 mt-1">Review and approve stock received from manufacturers</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filter Buttons */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setStatusFilter('PENDING')}
              className={statusFilter === 'PENDING' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-300 hover:bg-gray-400'}
            >
              Pending
            </Button>
            <Button
              onClick={() => setStatusFilter('APPROVED')}
              className={statusFilter === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 hover:bg-gray-400'}
            >
              Approved
            </Button>
            <Button
              onClick={() => setStatusFilter('REJECTED')}
              className={statusFilter === 'REJECTED' ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 hover:bg-gray-400'}
            >
              Rejected
            </Button>
            <Button
              onClick={() => setStatusFilter('ALL')}
              className={statusFilter === 'ALL' ? 'bg-blue-900 hover:bg-blue-800' : 'bg-gray-300 hover:bg-gray-400'}
            >
              All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Receive Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Reference</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total Qty</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No stock receive requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request.receive_request_id}>
                      <TableCell className="font-medium">
                        {request.purchase_order_reference || 'N/A'}
                      </TableCell>
                      <TableCell>{request.manufacturer_name || 'N/A'}</TableCell>
                      <TableCell>{request.requested_by_name}</TableCell>
                      <TableCell className="text-right">{request.item_count || 0}</TableCell>
                      <TableCell className="text-right">{request.total_quantity || 0}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(request.requested_at)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(request)}
                            className="text-blue-600 border-blue-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {request.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveClick(request)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleReject(request.receive_request_id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Receive Request Details</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Manufacturer</p>
                  <p className="font-semibold">{selectedRequest.manufacturer_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">PO Reference</p>
                  <p className="font-semibold">{selectedRequest.purchase_order_reference || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requested By</p>
                  <p className="font-semibold">{selectedRequest.requested_by_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requested Date</p>
                  <p className="font-semibold text-sm">{formatDate(selectedRequest.requested_at)}</p>
                </div>
                {selectedRequest.reviewed_at && (
                  <div>
                    <p className="text-sm text-gray-600">Reviewed Date</p>
                    <p className="font-semibold text-sm">{formatDate(selectedRequest.reviewed_at)}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedRequest.review_notes && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900">Admin Notes</p>
                  <p className="text-sm text-blue-800 mt-2">{selectedRequest.review_notes}</p>
                </div>
              )}

              {/* Items Table */}
              <div>
                <h3 className="font-semibold mb-3">Items to Receive</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Batch No.</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRequest.items && selectedRequest.items.map((item) => (
                        <TableRow key={item.item_id}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell className="text-sm text-gray-600">{item.product_code}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-sm">{item.batch_number}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(item.expiry_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">LKR {item.unit_price.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-semibold">
                            LKR {(item.quantity * item.unit_price).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Total */}
              <div className="text-right text-lg font-bold p-4 bg-gray-50 rounded-lg">
                Total Value: LKR{' '}
                {selectedRequest.items
                  ?.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
                  .toLocaleString()}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Stock Receive Request</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to approve this stock receive request? The items will be added to inventory.
            </p>

            <div className="space-y-2">
              <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
              <Textarea
                id="approval-notes"
                placeholder="Add any notes about this approval..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
