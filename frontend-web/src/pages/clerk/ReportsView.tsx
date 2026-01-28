import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { 
  FileText, 
  Download, 
  Calendar,
  Package,
  TrendingUp,
  Users,
  Truck,
  Filter
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

interface ReportsPageProps {
  onNavigate: (view: string) => void;
}

export function ReportsView({ onNavigate }: ReportsPageProps) {
  const [activeReport, setActiveReport] = useState('daily-sales');

  const dailySalesData = [
    { date: '2025-10-13', orders: 45, revenue: 52000 },
    { date: '2025-10-14', orders: 52, revenue: 61000 },
    { date: '2025-10-15', orders: 48, revenue: 55000 },
    { date: '2025-10-16', orders: 61, revenue: 72000 },
    { date: '2025-10-17', orders: 55, revenue: 65000 },
    { date: '2025-10-18', orders: 58, revenue: 68000 },
    { date: '2025-10-19', orders: 63, revenue: 75000 },
  ];

  const stockExpiryData = [
    { product: 'Product A', batch: 'B001', quantity: 100, expiryDate: '2025-10-25', daysLeft: 6 },
    { product: 'Product C', batch: 'B042', quantity: 50, expiryDate: '2025-10-28', daysLeft: 9 },
    { product: 'Product B', batch: 'B023', quantity: 75, expiryDate: '2025-11-02', daysLeft: 14 },
  ];

  const customerSalesData = [
    { customer: 'ABC Retail', orders: 24, revenue: 125000, avgOrder: 5208 },
    { customer: 'XYZ Store', orders: 18, revenue: 98000, avgOrder: 5444 },
    { customer: 'Best Shop', orders: 22, revenue: 115000, avgOrder: 5227 },
    { customer: 'Quick Mart', orders: 15, revenue: 78000, avgOrder: 5200 },
  ];

  const routePerformanceData = [
    { route: 'Route 1 - North', customers: 12, orders: 45, revenue: 85000 },
    { route: 'Route 2 - South', customers: 15, orders: 52, revenue: 98000 },
    { route: 'Route 3 - East', customers: 10, orders: 38, revenue: 72000 },
    { route: 'Route 4 - West', customers: 14, orders: 48, revenue: 88000 },
  ];

  const reportTypes = [
    { id: 'daily-sales', name: 'Daily Sales Report', icon: TrendingUp },
    { id: 'stock-expiry', name: 'Stock Expiry Report', icon: Package },
    { id: 'customer-sales', name: 'Customer-wise Sales', icon: Users },
    { id: 'route-performance', name: 'Route Performance', icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="mb-0 text-blue-900">Reports & Analytics</h1>
              <p className="text-muted-foreground">Generate and download reports</p>
            </div>
          </div>
          <Button onClick={() => onNavigate('dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Report Type Selector */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Report Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {reportTypes.map(report => {
                  const Icon = report.icon;
                  return (
                    <button
                      key={report.id}
                      onClick={() => setActiveReport(report.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        activeReport === report.id
                          ? 'bg-blue-50 text-blue-900 border border-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{report.name}</span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Report Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" defaultValue="2025-10-01" />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" defaultValue="2025-10-19" />
                  </div>
                  <div className="space-y-2">
                    <Label>Filter By</Label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="product">By Product</SelectItem>
                        <SelectItem value="customer">By Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button className="bg-blue-900 hover:bg-blue-800">
                    Apply Filters
                  </Button>
                  <Button variant="outline">
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Report Content */}
            {activeReport === 'daily-sales' && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Daily Sales Trend</CardTitle>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailySalesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#1e3a8a" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sales Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Orders</TableHead>
                          <TableHead>Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailySalesData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.date}</TableCell>
                            <TableCell>{row.orders}</TableCell>
                            <TableCell className="text-green-600">LKR {row.revenue.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}

            {activeReport === 'stock-expiry' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Stock Expiry Report</CardTitle>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Days Left</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockExpiryData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.product}</TableCell>
                          <TableCell>{row.batch}</TableCell>
                          <TableCell>{row.quantity}</TableCell>
                          <TableCell>{row.expiryDate}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full ${
                              row.daysLeft <= 7 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {row.daysLeft} days
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeReport === 'customer-sales' && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Customer-wise Sales Report</CardTitle>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Avg Order</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customerSalesData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.customer}</TableCell>
                          <TableCell>{row.orders}</TableCell>
                          <TableCell className="text-green-600">LKR {row.revenue.toLocaleString()}</TableCell>
                          <TableCell>LKR {row.avgOrder.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeReport === 'route-performance' && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Route Revenue Comparison</CardTitle>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={routePerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="route" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#1e3a8a" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Route Performance Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Route</TableHead>
                          <TableHead>Customers</TableHead>
                          <TableHead>Orders</TableHead>
                          <TableHead>Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {routePerformanceData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{row.route}</TableCell>
                            <TableCell>{row.customers}</TableCell>
                            <TableCell>{row.orders}</TableCell>
                            <TableCell className="text-green-600">LKR {row.revenue.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
