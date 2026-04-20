import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Calendar, Truck, MapPin, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface PlannedRoute {
  plan_id: number;
  planned_date: string;
  details: Array<{
    area: { area_name: string };
    route: { route_name: string };
    van: { vehicle_number: string };
  }>;
}

export default function PlannedRoutesView() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [plannedRoutes, setPlannedRoutes] = useState<PlannedRoute | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetchPlannedRoutes();
    }
  }, [selectedDate]);

  const fetchPlannedRoutes = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/route-plans/approved/${selectedDate}`);
      if (response.data.success) {
        setPlannedRoutes(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching planned routes:', error);
      setPlannedRoutes(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const getNextDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planned Routes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {getNextDates().map((date) => (
              <button
                key={date}
                onClick={() => handleDateChange(date)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                  selectedDate === date
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : !plannedRoutes ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No routes planned for {new Date(selectedDate).toLocaleDateString()}</p>
              <p className="text-sm">Check back later or select another date</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 mb-4">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Routes planned for {new Date(selectedDate).toLocaleDateString()}</span>
              </div>
              
              <div className="grid gap-3">
                {plannedRoutes.details.map((detail, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{detail.area.area_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <span>{detail.route.route_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <span>Van: {detail.van.vehicle_number}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}