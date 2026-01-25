import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { KPICard } from "../../components/common/KPICard";
import { DollarSign, TrendingUp, Truck, Users, Package, FileText, Bell, BarChart3, UserPlus, Calendar, LogOut} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/form-components";

// Dummy data (will be replaced with API calls)
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

const initialEmployeeData = [
  { id: 1, name: 'Kasun Perera', role: 'Sales Representative', contact: '+94 77 123 4567', email: 'kasun@manjula.lk', isActive: true },
  { id: 2, name: 'Nimal Silva', role: 'Sales Representative', contact: '+94 77 234 5678', email: 'nimal@manjula.lk', isActive: true },
  { id: 3, name: 'Ruwan Fernando', role: 'Sales Representative', contact: '+94 77 345 6789', email: 'ruwan@manjula.lk', isActive: false },
  { id: 4, name: 'Priya Jayasinghe', role: 'Clerk', contact: '+94 77 456 7890', email: 'priya@manjula.lk', isActive: true },
  { id: 5, name: 'Sanduni Wickramasinghe', role: 'Clerk', contact: '+94 77 567 8901', email: 'sanduni@manjula.lk', isActive: true },
];

const inventoryData = [
  { id: 'P001', product: 'King Coconut Shampoo 200ml', unitPrice: 550, qtyStore: 450, qtyVans: 50 },
  { id: 'P002', product: 'King Coconut Conditioner 200ml', unitPrice: 580, qtyStore: 320, qtyVans: 45 },
  { id: 'P003', product: 'Black Henna', unitPrice: 320, qtyStore: 580, qtyVans: 220 },
  { id: 'P004', product: 'Hand Wash Rose 500ml', unitPrice: 850, qtyStore: 290, qtyVans: 95 },
  { id: 'P005', product: 'Hand Wash Lemon 500ml', unitPrice: 850, qtyStore: 720, qtyVans: 80 },
];

export default function OwnerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showPlanRoute, setShowPlanRoute] = useState(false);
  const [employees, setEmployees] = useState(initialEmployeeData);

  const [newEmployee, setNewEmployee] = useState({
    name: '',
    username: '',
    password: '',
    role: 'Sales Representative',
    email: '',
    contact: ''
  });

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

  const routeSchedule: Record<string, string[]> = {
    'Area 1 - Battaramulla': [weekDates[0], weekDates[2], weekDates[4]],
    'Area 2 - Nugegoda': [weekDates[1], weekDates[3], weekDates[6]],
    'Area 3 - Kiribathgoda': [weekDates[0], weekDates[3], weekDates[5]],
  };

  const toggleEmployeeStatus = (id: number) => {
    setEmployees(prevEmployees => 
      prevEmployees.map(emp => 
        emp.id === id ? { ...emp, isActive: !emp.isActive } : emp
      )
    );
  };

  const handleAddEmployee = () => {
    // TODO: Connect to API
    const newEmp = {
      id: employees.length + 1,
      name: newEmployee.name,
      role: newEmployee.role as 'Sales Representative' | 'Clerk',
      contact: newEmployee.contact,
      email: newEmployee.email,
      isActive: true
    };
    setEmployees([...employees, newEmp]);
    setShowAddEmployee(false);
    setNewEmployee({
      name: '',
      username: '',
      password: '',
      role: 'Sales Representative',
      email: '',
      contact: ''
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-900 mb-0">Manjula Marketing DMS</h1>
              <p className="text-sm text-gray-600">Good Morning, {user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b px-6 py-3 overflow-x-auto">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 transition ${
              activeView === 'dashboard' 
                ? 'bg-blue-900 text-white' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveView('employees')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 transition ${
              activeView === 'employees' 
                ? 'bg-blue-900 text-white' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Employees
          </button>
          <button 
            onClick={() => setActiveView('inventory')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 transition ${
              activeView === 'inventory' 
                ? 'bg-blue-900 text-white' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Package className="w-4 h-4" />
            Inventory
          </button>
          <button 
            onClick={() => setActiveView('vans')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 transition ${
              activeView === 'vans' 
                ? 'bg-blue-900 text-white' 
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Truck className="w-4 h-4" />
            Vans & Routes
          </button>
          <button className="px-4 py-2 hover:bg-gray-100 rounded-lg whitespace-nowrap flex items-center gap-2 text-gray-700 transition">
            <FileText className="w-4 h-4" />
            Reports
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6 max-w-[1400px] mx-auto">
        {activeView === 'dashboard' && (
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
        )}

        {activeView === 'employees' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Employee Management</CardTitle>
              <Button onClick={() => setShowAddEmployee(true)} className="bg-blue-900 hover:bg-blue-800">
                <UserPlus className="w-4 h-4 mr-2" />
                Add New Employee
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact No</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          employee.role === 'Sales Representative' 
                            ? 'bg-blue-100 text-blue-900' 
                            : 'bg-pink-100 text-pink-700'
                        }`}>
                          {employee.role}
                        </span>
                      </TableCell>
                      <TableCell>{employee.contact}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          employee.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => toggleEmployeeStatus(employee.id)}
                          variant={employee.isActive ? "outline" : "default"}
                          className={employee.isActive 
                            ? "border-red-500 text-red-600 hover:bg-red-50" 
                            : "bg-green-600 hover:bg-green-700 text-white"
                          }
                        >
                          {employee.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeView === 'inventory' && (
          <Card>
            <CardHeader>
              <CardTitle>Available Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Unit Price (LKR)</TableHead>
                    <TableHead>Qty in Store</TableHead>
                    <TableHead>Qty in Vans</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.product}</TableCell>
                      <TableCell>{item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={item.qtyStore < 100 ? 'text-red-600 font-semibold' : ''}>
                          {item.qtyStore}
                        </span>
                      </TableCell>
                      <TableCell>{item.qtyVans}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeView === 'vans' && (
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
                            className={`p-3 rounded-lg text-center transition ${
                              isScheduled
                                ? 'bg-blue-900 text-white'
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            <p className="text-xs mb-1">
                              {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </p>
                            <p className={`font-semibold ${isScheduled ? 'text-white' : 'text-gray-600'}`}>
                              {new Date(date).getDate()}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add Employee Dialog */}
      <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                placeholder="Enter employee name" 
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                placeholder="Enter email" 
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact</Label>
              <Input 
                placeholder="Enter contact number" 
                value={newEmployee.contact}
                onChange={(e) => setNewEmployee({...newEmployee, contact: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input 
                placeholder="Enter username" 
                value={newEmployee.username}
                onChange={(e) => setNewEmployee({...newEmployee, username: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input 
                type="password" 
                placeholder="Enter password" 
                value={newEmployee.password}
                onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
              >
                <option value="Sales Representative">Sales Representative</option>
                <option value="Clerk">Clerk</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleAddEmployee}
                className="flex-1 bg-blue-900 hover:bg-blue-800"
              >
                Confirm
              </Button>
              <Button 
                onClick={() => setShowAddEmployee(false)} 
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            <div className="flex gap-3 pt-4">
              <Button className="flex-1 bg-blue-900 hover:bg-blue-800">Confirm</Button>
              <Button onClick={() => setShowPlanRoute(false)} variant="outline" className="flex-1">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}