// frontend-web/src/pages/sales/DashboardView.tsx
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { KPICard } from "../../components/common/KPICard";
import { Target, TrendingUp, Users, Package } from "lucide-react";

export default function SalesDashboardView() {
  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Today's Sales"
          value="LKR 45,000"
          icon={TrendingUp}
          iconColor="bg-green-100 text-green-600"
        />
        <KPICard
          title="Orders Today"
          value="12"
          icon={Package}
          iconColor="bg-blue-100 text-blue-600"
        />
        <KPICard
          title="Active Customers"
          value="28"
          icon={Users}
          iconColor="bg-purple-100 text-purple-600"
        />
        <KPICard
          title="Monthly Target"
          value="65%"
          icon={Target}
          trend={{ value: "15%", isPositive: true }}
          iconColor="bg-orange-100 text-orange-600"
        />
      </div>

      {/* Today's Route */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Today's Route Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-semibold text-blue-900">Route: Battaramulla Area 1</p>
                <p className="text-sm text-gray-600">8 customers scheduled</p>
              </div>
              <span className="px-3 py-1 bg-blue-900 text-white text-xs rounded-full">Active</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Van Stock Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Van Stock Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">45</p>
              <p className="text-sm text-gray-600">Total Items</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">38</p>
              <p className="text-sm text-gray-600">In Stock</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">5</p>
              <p className="text-sm text-gray-600">Low Stock</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">2</p>
              <p className="text-sm text-gray-600">Out of Stock</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}