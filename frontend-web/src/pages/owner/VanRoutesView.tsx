// frontend-web/src/pages/owner/VansRoutesView.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/form-components";
import { Calendar } from "lucide-react";

export default function VansRoutesView() {
  const [showPlanRoute, setShowPlanRoute] = useState(false);

  const getNextWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getNextWeekDates();

  // TODO: Replace with API calls
  const routeSchedule: Record<string, string[]> = {
    'Area 1 - Battaramulla': [weekDates[0], weekDates[2], weekDates[4]],
    'Area 2 - Nugegoda': [weekDates[1], weekDates[3], weekDates[6]],
    'Area 3 - Kiribathgoda': [weekDates[0], weekDates[3], weekDates[5]],
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Vans & Delivery Routes</CardTitle>
          <Button onClick={() => setShowPlanRoute(true)} className="bg-blue-900 hover:bg-blue-800">
            <Calendar className="w-4 h-4 mr-2" />
            Plan Next Week
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(routeSchedule).map(([area, dates]) => (
              <div key={area} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">{area}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                  {weekDates.map((date, idx) => {
                    const isScheduled = dates.includes(date);
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg text-center transition cursor-pointer ${
                          isScheduled
                            ? 'bg-blue-900 text-white shadow-md'
                            : 'bg-white border border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <p className="text-xs mb-1">
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className={`font-semibold ${isScheduled ? 'text-white' : 'text-gray-600'}`}>
                          {new Date(date).getDate()}
                        </p>
                        {isScheduled && (
                          <p className="text-xs mt-1 opacity-90">Scheduled</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-900 rounded"></div>
              <span className="text-gray-600">Scheduled Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
              <span className="text-gray-600">Available Day</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Route Dialog */}
      <Dialog open={showPlanRoute} onOpenChange={setShowPlanRoute}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Plan Next Week Routes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Input type="date" />
            </div>
            <div className="space-y-2">
              <Label>Select Route</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select route</option>
                <option value="area1">Area 1 - Battaramulla</option>
                <option value="area2">Area 2 - Nugegoda</option>
                <option value="area3">Area 3 - Kiribathgoda</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Assign Van</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select van</option>
                <option value="van1">Van 1 - ABC-1234</option>
                <option value="van2">Van 2 - DEF-5678</option>
                <option value="van3">Van 3 - GHI-9012</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button className="flex-1 bg-blue-900 hover:bg-blue-800">Confirm</Button>
              <Button onClick={() => setShowPlanRoute(false)} variant="outline" className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}