import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Label } from '../../components/ui/form-components';
import { CheckCircle, XCircle, Clock, User, Calendar, Truck, MapPin, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface RoutePlan {
  plan_id: number;
  planned_date: string;
  status: string;
  notes?: string;
  rejection_reason?: string;
  requester_name: string;
  requester_email: string;
  created_at: string;
  details: Array<{
    area_name: string;
    route_name: string;
    vehicle_number: string;
  }>;
}

export default function RouteApprovals() {
  const [pendingPlans, setPendingPlans] = useState<RoutePlan[]>([]);
  const [approvedPlans, setApprovedPlans] = useState<RoutePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<RoutePlan | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  useEffect(() => {
    fetchPendingPlans();
    fetchApprovedPlans();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPendingPlans();
      fetchApprovedPlans();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingPlans = async () => {
    try {
      console.log('Fetching pending plans...');
      const response = await api.get('/route-plans/pending');
      console.log('Pending plans response:', response.data);
      
      if (response.data.success) {
        setPendingPlans(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching pending plans:', error);
      toast.error('Failed to fetch pending approvals');
    }
  };

  const fetchApprovedPlans = async () => {
    try {
      const response = await api.get('/route-plans');
      if (response.data.success) {
        const approved = (response.data.data || []).filter((plan: any) => plan.status === 'approved');
        setApprovedPlans(approved);
      }
    } catch (error) {
      console.error('Error fetching approved plans:', error);
    }
  };

  const handleApprove = async (planId: number) => {
    setLoading(true);
    try {
      const response = await api.put(`/route-plans/${planId}/approve`);
      
      if (response.data.success) {
        toast.success('Route plan approved successfully');
        fetchPendingPlans();
        fetchApprovedPlans();
        setSelectedPlan(null);
      }
    } catch (error: any) {
      console.error('Error approving plan:', error);
      toast.error(error.response?.data?.message || 'Failed to approve plan');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    if (!selectedPlan) return;

    setLoading(true);
    try {
      const response = await api.put(`/route-plans/${selectedPlan.plan_id}/reject`, {
        reason: rejectionReason
      });
      
      if (response.data.success) {
        toast.success('Route plan rejected');
        fetchPendingPlans();
        setShowRejectDialog(false);
        setRejectionReason('');
        setSelectedPlan(null);
      }
    } catch (error: any) {
      console.error('Error rejecting plan:', error);
      toast.error(error.response?.data?.message || 'Failed to reject plan');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b">
        <button
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'pending' 
              ? 'text-blue-900 border-b-2 border-blue-900' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals ({pendingPlans.length})
        </button>
        <button
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'approved' 
              ? 'text-blue-900 border-b-2 border-blue-900' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('approved')}
        >
          Approved Plans ({approvedPlans.length})
        </button>
      </div>

      {activeTab === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Route Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingPlans.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Approvals</h3>
                <p className="text-gray-500">All route plans have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPlans.map((plan) => (
                  <div key={plan.plan_id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-lg">{formatDate(plan.planned_date)}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>Requested by: {plan.requester_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Requested: {new Date(plan.created_at).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <h4 className="font-medium text-sm text-gray-700">Route Assignments:</h4>
                          {plan.details && plan.details.map((detail, idx) => (
                            <div key={idx} className="grid grid-cols-3 gap-4 p-2 bg-gray-50 rounded text-sm">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">{detail.area_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Truck className="w-4 h-4 text-gray-500" />
                                <span>{detail.route_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Truck className="w-4 h-4 text-gray-500" />
                                <span>Van: {detail.vehicle_number}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {plan.notes && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                            <span className="font-medium">Clerk's Notes:</span> {plan.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleApprove(plan.plan_id)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedPlan(plan);
                            setShowRejectDialog(true);
                          }}
                          disabled={loading}
                          variant="destructive"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'approved' && (
        <Card>
          <CardHeader>
            <CardTitle>Approved Route Plans</CardTitle>
          </CardHeader>
          <CardContent>
            {approvedPlans.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Approved Plans</h3>
                <p className="text-gray-500">Approved route plans will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvedPlans.map((plan) => (
                  <div key={plan.plan_id} className="border rounded-lg p-4 bg-green-50">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-lg">{formatDate(plan.planned_date)}</span>
                        </div>
                        <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">Approved</span>
                      </div>
                      
                      <div className="space-y-2 mt-2">
                        {plan.details && plan.details.map((detail, idx) => (
                          <div key={idx} className="grid grid-cols-3 gap-4 p-2 bg-white rounded text-sm">
                            <div className="font-medium">{detail.area_name}</div>
                            <div>{detail.route_name}</div>
                            <div>Van: {detail.vehicle_number}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Route Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleReject}
                disabled={loading}
                variant="destructive"
                className="flex-1"
              >
                Confirm Rejection
              </Button>
              <Button onClick={() => setShowRejectDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}