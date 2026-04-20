import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/form-components';
import { Calendar, Truck, MapPin, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Route {
  route_id: number;
  route_name: string;
}

interface Van {
  van_id: number;
  vehicle_number: string;
}

interface AreaWithDetails {
  area_id: number;
  area_name: string;
  van: Van | null;
  routes: Route[];
}

interface RouteSelection {
  area_id: number;
  area_name: string;
  van_id: number;
  van_number: string;
  route_id: number | null;
  route_name: string;
}

interface RoutePlan {
  plan_id: number;
  planned_date: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  notes?: string;
  requester_name?: string;
  details: Array<{
    area_name: string;
    route_name: string;
    vehicle_number: string;
  }>;
  created_at: string;
}

export default function RoutePlanner() {
  const [areas, setAreas] = useState<AreaWithDetails[]>([]);
  const [selections, setSelections] = useState<RouteSelection[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [myPlans, setMyPlans] = useState<RoutePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [dateAvailable, setDateAvailable] = useState<boolean | null>(null);
  const [existingPlanStatus, setExistingPlanStatus] = useState<string | null>(null);

  // Load areas, vans, and routes when dialog opens
  useEffect(() => {
    if (showDialog) {
      loadAreasAndVans();
    }
  }, [showDialog]);

  useEffect(() => {
    fetchMyPlans();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      checkDateAvailability(selectedDate);
    }
  }, [selectedDate]);

  const loadAreasAndVans = async () => {
    setLoadingData(true);
    try {
      console.log('Loading areas with vans and routes...');
      const response = await api.get('/route-plans/setup-data');
      console.log('Setup data response:', response.data);
      
      if (response.data.success) {
        const areasData = response.data.data.areas || [];
        setAreas(areasData);
        
        // Initialize selections for each area
        const initialSelections = areasData.map((area: AreaWithDetails) => ({
          area_id: area.area_id,
          area_name: area.area_name,
          van_id: area.van?.van_id || 0,
          van_number: area.van?.vehicle_number || 'No van assigned',
          route_id: null,
          route_name: ''
        }));
        
        setSelections(initialSelections);
        console.log('Initial selections:', initialSelections);
      } else {
        toast.error('Failed to load setup data');
      }
    } catch (error: any) {
      console.error('Error fetching setup data:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchMyPlans = async () => {
    try {
      const response = await api.get('/route-plans');
      console.log('My plans response:', response.data);
      
      if (response.data.success) {
        setMyPlans(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching my plans:', error);
    }
  };

  const checkDateAvailability = async (date: string) => {
    try {
      console.log('Checking date availability for:', date);
      const response = await api.get(`/route-plans/check-date/${date}`);
      console.log('Date availability response:', response.data);
      
      if (response.data.success) {
        const isAvailable = response.data.data.available;
        setDateAvailable(isAvailable);
        setExistingPlanStatus(response.data.data.existingPlan?.status || null);
      } else {
        setDateAvailable(false);
      }
    } catch (error: any) {
      console.error('Error checking date:', error);
      setDateAvailable(false);
    }
  };

  const handleRouteChange = (areaId: number, routeId: number, routeName: string) => {
    setSelections(prev => prev.map(selection => 
      selection.area_id === areaId 
        ? { ...selection, route_id: routeId, route_name: routeName }
        : selection
    ));
  };

  const isFormComplete = () => {
    if (!selectedDate || !dateAvailable) return false;
    if (selections.length === 0) return false;
    return selections.every(selection => selection.route_id !== null);
  };

  const handleSubmit = async () => {
    if (!isFormComplete()) {
      toast.error('Please select a route for all areas');
      return;
    }

    const assignmentsData = selections.map(s => ({
      area_id: s.area_id,
      route_id: s.route_id,
      van_id: s.van_id
    }));

    setLoading(true);
    try {
      const response = await api.post('/route-plans', {
        planned_date: selectedDate,
        assignments: assignmentsData,
        notes
      });

      if (response.data.success) {
        toast.success('Route plan request submitted for approval');
        setShowDialog(false);
        resetForm();
        fetchMyPlans();
      } else {
        toast.error(response.data.message || 'Failed to submit route plan');
      }
    } catch (error: any) {
      console.error('Error creating route plan:', error);
      toast.error(error.response?.data?.message || 'Failed to submit route plan');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDate('');
    setNotes('');
    setDateAvailable(null);
    setExistingPlanStatus(null);
    setSelections([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center gap-1 text-yellow-600"><Clock className="w-4 h-4" /> Pending Approval</span>;
      case 'approved':
        return <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /> Approved</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-red-600"><XCircle className="w-4 h-4" /> Rejected</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Plan Daily Routes</CardTitle>
          <Button onClick={() => setShowDialog(true)} className="bg-blue-900 hover:bg-blue-800">
            <Calendar className="w-4 h-4 mr-2" />
            Plan Routes for Next Day
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">My Recent Requests</h3>
            {!myPlans || myPlans.length === 0 ? (
              <p className="text-gray-500">No route requests yet</p>
            ) : (
              <div className="space-y-3">
                {myPlans.slice(0, 5).map((plan) => (
                  <div key={plan.plan_id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">Date: {new Date(plan.planned_date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600">Requested: {new Date(plan.created_at).toLocaleString()}</p>
                      </div>
                      <div>{getStatusBadge(plan.status)}</div>
                    </div>
                    <div className="space-y-2 mt-2">
                      {plan.details && plan.details.map((detail, idx) => (
                        <div key={idx} className="text-sm grid grid-cols-3 gap-2">
                          <span className="font-medium">{detail.area_name}</span>
                          <span>→ {detail.route_name}</span>
                          <span>Van: {detail.vehicle_number}</span>
                        </div>
                      ))}
                    </div>
                    {plan.rejection_reason && (
                      <p className="text-sm text-red-600 mt-2">Reason: {plan.rejection_reason}</p>
                    )}
                    {plan.notes && (
                      <p className="text-sm text-gray-600 mt-2">Notes: {plan.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Route Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plan Routes for Next Day</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              {selectedDate && dateAvailable === false && (
                <div className="flex items-center gap-2 text-red-600 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>A {existingPlanStatus} plan already exists for this date. Please choose another date.</span>
                </div>
              )}
            </div>

            {selectedDate && dateAvailable === true && (
              <>
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
                    <span className="ml-2">Loading areas and routes...</span>
                  </div>
                ) : (
                  <>
                    {!selections || selections.length === 0 ? (
                      <div className="text-center py-8 text-red-500">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                        <p>No areas found in the system!</p>
                        <p className="text-sm">Please add delivery areas and assign vans first.</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <h3 className="font-semibold">Select Route for Each Area</h3>
                          {selections.map((selection) => (
                            <div key={selection.area_id} className="p-4 border rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-blue-900">{selection.area_name}</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Truck className="w-4 h-4" />
                                  <span>Van: {selection.van_number}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Select Route for {selection.area_name}</Label>
                                <select
                                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  value={selection.route_id || ''}
                                  onChange={(e) => {
                                    const routeId = Number(e.target.value);
                                    const area = areas.find(a => a.area_id === selection.area_id);
                                    const route = area?.routes.find(r => r.route_id === routeId);
                                    if (route) {
                                      handleRouteChange(selection.area_id, route.route_id, route.route_name);
                                    }
                                  }}
                                >
                                  <option value="">Select a route...</option>
                                  {areas
                                    .find(a => a.area_id === selection.area_id)
                                    ?.routes.map((route) => (
                                      <option key={route.route_id} value={route.route_id}>
                                        {route.route_name}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <Label>Notes (Optional)</Label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any additional notes for the owner..."
                            rows={3}
                            className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={handleSubmit}
                            disabled={loading || !isFormComplete()}
                            className="flex-1 bg-blue-900 hover:bg-blue-800"
                          >
                            {loading ? 'Submitting...' : 'Submit for Approval'}
                          </Button>
                          <Button onClick={() => {
                            setShowDialog(false);
                            resetForm();
                          }} variant="outline" className="flex-1">
                            Cancel
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {selectedDate && dateAvailable === null && !loadingData && (
              <div className="text-center py-4 text-gray-500">
                Select a date to continue
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}