import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { KPICard } from "../../components/common/KPICard";
import { 
  ShoppingCart, 
  Users, 
  MapPin,
  Package,
  Bell,
  FileText,
  UserPlus,
  RotateCcw,
  Plus,
  Trash2
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

interface SalesRepDashboardProps {
  onNavigate: (view: string) => void;
}

export function SalesRepDashboard({ onNavigate }: SalesRepDashboardProps) {
  const [activeView, setActiveView] = useState('dashboard');
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [orderProducts, setOrderProducts] = useState<Array<{product: string, qty: number, price: number}>>([]);
  const [showPrintPrompt, setShowPrintPrompt] = useState(false);

  const todayVisits = [
    { customer: 'ABC Retail', address: '123 Main St, Colombo', status: 'Completed', date: '2025-10-20' },
    { customer: 'XYZ Store', address: '456 Oak Ave, Kandy', status: 'Pending', date: '2025-10-20' },
    { customer: 'Best Shop', address: '789 Pine Rd, Galle', status: 'Pending', date: '2025-10-20' },
  ];

  const purchaseHistory = [
    { invoiceNo: 'INV-001', amount: 45000, status: 'Paid' },
    { invoiceNo: 'INV-002', amount: 38000, status: 'Remaining: 15000' },
    { invoiceNo: 'INV-003', amount: 52000, status: 'Paid' },
  ];

  const pendingReturns = [
    { customer: 'ABC Retail', product: 'Product A', reason: 'Damaged' },
    { customer: 'XYZ Store', product: 'Product C', reason: 'Expired' },
  ];

  const addOrderProduct = () => {
    setOrderProducts([...orderProducts, { product: '', qty: 0, price: 0 }]);
  };

  const removeOrderProduct = (index: number) => {
    setOrderProducts(orderProducts.filter((_, i) => i !== index));
  };

  const handleConfirmOrder = () => {
    setActiveForm(null);
    setShowPrintPrompt(true);
    setOrderProducts([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Dreamron" className="h-10 w-auto" />
            <div>
              <h1 className="mb-0 text-blue-900">Manjula Marketing DMS</h1>
              <p className="text-muted-foreground">Sales Representative</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('alerts')} className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button onClick={() => onNavigate('profile')} className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg">
              <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-white">S</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b px-6 py-3 overflow-x-auto">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${activeView === 'dashboard' ? 'bg-blue-900 text-white' : 'hover:bg-gray-100'}`}
          >
            Dashboard
          </button>
          <button onClick={() => setActiveForm('customer')} className="px-4 py-2 hover:bg-gray-100 rounded-lg whitespace-nowrap">
            <UserPlus className="w-4 h-4 inline mr-2" />
            Register Customer
          </button>
          <button onClick={() => setActiveForm('order')} className="px-4 py-2 hover:bg-gray-100 rounded-lg whitespace-nowrap">
            <ShoppingCart className="w-4 h-4 inline mr-2" />
            Place Order
          </button>
          <button onClick={() => onNavigate('invoice')} className="px-4 py-2 hover:bg-gray-100 rounded-lg whitespace-nowrap">
            <FileText className="w-4 h-4 inline mr-2" />
            Invoice
          </button>
          <button 
            onClick={() => setActiveView('history')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${activeView === 'history' ? 'bg-blue-900 text-white' : 'hover:bg-gray-100'}`}
          >
            Purchase History
          </button>
          <button 
            onClick={() => setActiveView('returns')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${activeView === 'returns' ? 'bg-blue-900 text-white' : 'hover:bg-gray-100'}`}
          >
            <RotateCcw className="w-4 h-4 inline mr-2" />
            Returns
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-4 md:p-6 max-w-[1400px] mx-auto">
        {activeView === 'dashboard' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              <KPICard
                title="Daily Orders"
                value="24"
                icon={ShoppingCart}
                trend={{ value: "15%", isPositive: true }}
                iconColor="bg-green-100 text-green-600"
              />
              <KPICard
                title="Customers Visited"
                value="8/15"
                icon={Users}
                iconColor="bg-blue-100 text-blue-600"
              />
              <KPICard
                title="Remaining Visits"
                value="7"
                icon={MapPin}
                iconColor="bg-orange-100 text-orange-600"
              />
            </div>

            {/* Today's Schedule */}
            <Card className="mb-6 md:mb-8">
              <CardHeader>
                <CardTitle>Today's Delivery Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayVisits.map((visit, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-900" />
                          <p>{visit.customer}</p>
                        </div>
                        <p className="text-muted-foreground ml-6">{visit.address}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-6 sm:ml-0">
                        <span className="text-muted-foreground">{visit.date}</span>
                        <span className={`px-3 py-1 rounded-full ${
                          visit.status === 'Completed' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {visit.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeView === 'history' && (
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label>Route</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select route" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="area1">Area 1</SelectItem>
                      <SelectItem value="area2">Area 2</SelectItem>
                      <SelectItem value="area3">Area 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer-a">ABC Retail</SelectItem>
                      <SelectItem value="customer-b">XYZ Store</SelectItem>
                      <SelectItem value="customer-c">Best Shop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="mb-6 bg-blue-900 hover:bg-blue-800">Submit</Button>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Amount (LKR)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseHistory.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.invoiceNo}</TableCell>
                      <TableCell>LKR {row.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={row.status === 'Paid' ? 'text-green-600' : 'text-red-600'}>
                          {row.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeView === 'returns' && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Return Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingReturns.map((ret, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p>{ret.customer}</p>
                      <p className="text-muted-foreground">Product: {ret.product}</p>
                      <p className="text-muted-foreground">Reason: {ret.reason}</p>
                    </div>
                    <Button className="bg-green-600 hover:bg-green-700">Confirm</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Forms Dialogs */}
        <Dialog open={activeForm === 'customer'} onOpenChange={(open) => setActiveForm(open ? 'customer' : null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Register New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input placeholder="Enter customer name" />
              </div>
              <div className="space-y-2">
                <Label>Shop Name</Label>
                <Input placeholder="Enter shop name" />
              </div>
              <div className="space-y-2">
                <Label>Street</Label>
                <Input placeholder="Enter street address" />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input placeholder="Enter city" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input type="tel" placeholder="Enter phone number" />
              </div>
              <Button className="w-full bg-blue-900 hover:bg-blue-800">Register Customer</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={activeForm === 'order'} onOpenChange={(open) => {
          setActiveForm(open ? 'order' : null);
          if (!open) setOrderProducts([]);
        }}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Place Customer Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer-a">ABC Retail</SelectItem>
                    <SelectItem value="customer-b">XYZ Store</SelectItem>
                    <SelectItem value="customer-c">Best Shop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {orderProducts.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Product {index + 1}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeOrderProduct(index)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product-a">Product A - LKR 250</SelectItem>
                        <SelectItem value="product-b">Product B - LKR 180</SelectItem>
                        <SelectItem value="product-c">Product C - LKR 320</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input type="number" placeholder="Enter quantity" />
                  </div>
                </div>
              ))}

              <Button onClick={addOrderProduct} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>

              {orderProducts.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal</span>
                    <span>LKR 2,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (18%)</span>
                    <span>LKR 450</span>
                  </div>
                  <div className="border-t border-blue-200 mt-2 pt-2 flex justify-between">
                    <span>Total</span>
                    <span>LKR 2,950</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleConfirmOrder} className="flex-1 bg-blue-900 hover:bg-blue-800">Confirm</Button>
                <Button onClick={() => {setActiveForm(null); setOrderProducts([]);}} variant="outline" className="flex-1">Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Print Invoice Prompt */}
        <Dialog open={showPrintPrompt} onOpenChange={setShowPrintPrompt}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Order Confirmed</DialogTitle>
            </DialogHeader>
            <div className="text-center py-6">
              <p className="mb-6">Would you like to print the invoice?</p>
              <div className="flex gap-3">
                <Button onClick={() => setShowPrintPrompt(false)} className="flex-1 bg-blue-900 hover:bg-blue-800">
                  Yes
                </Button>
                <Button onClick={() => setShowPrintPrompt(false)} variant="outline" className="flex-1">
                  No
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
