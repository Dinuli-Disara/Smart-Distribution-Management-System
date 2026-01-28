// frontend-web/src/pages/clerk/DashboardView.tsx
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { KPICard } from "../../components/common/KPICard";
import { Package, AlertTriangle, DollarSign, FileText } from "lucide-react";

export default function ClerkDashboardView() {
  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Pending Stock Transfers"
          value="8"
          icon={Package}
          iconColor="bg-blue-100 text-blue-600"
        />
        <KPICard
          title="Low Stock Alerts"
          value="5"
          icon={AlertTriangle}
          iconColor="bg-yellow-100 text-yellow-600"
        />
        <KPICard
          title="Pending Payments"
          value="LKR 245,000"
          icon={DollarSign}
          iconColor="bg-green-100 text-green-600"
        />
        <KPICard
          title="Invoices Today"
          value="24"
          icon={FileText}
          iconColor="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Stock received from manufacturer</p>
                <p className="text-sm text-gray-600">5 products added to inventory</p>
              </div>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Payment recorded</p>
                <p className="text-sm text-gray-600">Customer: ABC Retail - LKR 45,000</p>
              </div>
              <span className="text-xs text-gray-500">4 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}