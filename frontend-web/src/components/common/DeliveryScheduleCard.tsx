// frontend-web/src/components/common/DeliveryScheduleCard.tsx
import { Card, CardContent } from "../ui/card";
import { Truck } from "lucide-react";

interface DeliveryRoute {
  area: string;
  route: string;
}

interface DeliveryScheduleCardProps {
  title: string;
  deliveries: DeliveryRoute[];
}

export function DeliveryScheduleCard({ title, deliveries }: DeliveryScheduleCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">{title}</p>
            
            <div className="space-y-3 mt-3">
              {deliveries.map((delivery, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-700 font-semibold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {delivery.area}
                      </div>
                      <div className="text-sm text-gray-500">
                        Route: {delivery.route}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-3 rounded-full bg-purple-100 text-purple-600 ml-4">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}