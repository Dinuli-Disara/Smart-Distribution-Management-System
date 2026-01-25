// frontend-web/src/pages/owner/DashboardView.tsx
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { KPICard } from "../../components/common/KPICard";
import { DollarSign, TrendingUp, Truck } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// TODO: Replace with API calls
const salesData = [
  { month: 'Jan', sales: 12500, revenue: 1200000 },
  { month: 'Feb', sales: 13920, revenue: 1300000 },
  { month: 'Mar', sales: 13280, revenue: 1250000 },
  { month: 'Apr', sales: 16910, revenue: 1525000 },
  { month: 'May', sales: 15050, revenue: 1375000 },
  { month: 'Jun', sales: 17670, revenue: 1675000 },
];

const topCustomers = [
  { name: 'ABC Retail', sales: 550000 },
  { name: 'XYZ Store', sales: 480000 },
  { name: 'Best Shop', sales: 390000 },
  { name: 'Quick Mart', sales: 380000 },
  { name: 'Super Store', sales: 350000 },
];

const productPerformance = [
  { product: 'Amla Shampoo', units: 1200 },
  { product: 'Face Wash', units: 980 },
  { product: 'Hand Wash', units: 850 },
  { product: 'Hair Straightener', units: 720 },
  { product: 'Black Henna', units: 650 },
];

export default function DashboardView() {
  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <KPICard
          title="This Month Sales"
          value="LKR 1,675,000"
          icon={DollarSign}
          trend={{ value: "12.5%", isPositive: true }}
          iconColor="bg-green-100 text-green-600"
        />
        <KPICard
          title="Monthly Revenue"
          value="LKR 1,675,000"
          icon={TrendingUp}
          trend={{ value: "8.2%", isPositive: true }}
          iconColor="bg-blue-100 text-blue-600"
        />
        <KPICard
          title="Active Van Routes"
          value="12"
          icon={Truck}
          iconColor="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#1e3a8a" strokeWidth={2} name="Sales Quantity" />
                <Line type="monotone" dataKey="revenue" stroke="#db2777" strokeWidth={2} name="Revenue (LKR)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="units" fill="#1e3a8a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-900 font-semibold">{index + 1}</span>
                  </div>
                  <span className="font-medium">{customer.name}</span>
                </div>
                <span className="text-green-600 font-semibold">LKR {customer.sales.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}