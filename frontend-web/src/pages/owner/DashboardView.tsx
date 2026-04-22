// frontend-web/src/pages/owner/DashboardView.tsx
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { KPICard } from "../../components/common/KPICard";
import { DeliveryScheduleCard } from "../../components/common/DeliveryScheduleCard";
import { DollarSign, TrendingUp, Truck } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const salesData = [
  { month: 'Jan', sales: 125000, revenue: 12000 },
  { month: 'Feb', sales: 139200, revenue: 13000 },
  { month: 'Mar', sales: 132800, revenue: 12500 },
  { month: 'Apr', sales: 109100, revenue: 10250 },
];

const topCustomers = [
  { name: 'ABC Retail', sales: 55000 },
  { name: 'XYZ Store', sales: 48000 },
  { name: 'Best Shop', sales: 39000 },
  { name: 'Quick Mart', sales: 38000 },
  { name: 'Super Store', sales: 35000 },
];

const productPerformance = [
  { product: 'Amla Shampoo', units: 1200 },
  { product: 'Face Wash', units: 980 },
  { product: 'Hand Wash', units: 850 },
  { product: 'Hair Straightener', units: 720 },
  { product: 'Black Henna', units: 650 },
];

// Delivery schedule data
const todaysDeliveries = [
  { area: "Kiribathgoda", route: "Kiribathgoda 1" },
  { area: "Battaramulla", route: "Battaramulla 1" },
  { area: "Homagama", route: "Homagama 1" },
];

export default function DashboardView() {
  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="space-y-6">
          <KPICard
            title="This Month Revenue"
            value="LKR 10,250"
            icon={DollarSign}
            trend={{ value: "4.5%", isPositive: false }}
            iconColor="bg-green-100 text-green-600"
          />
          <KPICard
            title="Monthly Sale"
            value="LKR 109,100"
            icon={TrendingUp}
            trend={{ value: "8.2%", isPositive: false }}
            iconColor="bg-blue-100 text-blue-600"
          />
        </div>
        <div className="lg:col-span-2"> 
          <DeliveryScheduleCard
            title="Today's Delivery Schedule"
            deliveries={todaysDeliveries}
          />
        </div>
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