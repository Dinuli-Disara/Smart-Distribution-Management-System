import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { KPICard } from "../../components/common/KPICard";
import { 
  CreditCard, 
  PackageX, 
  Calendar,
  Package,
  Bell,
  FileText,
  DollarSign,
  ClipboardList,
  Truck,
  Plus
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

interface ClerkDashboardProps {
  onNavigate: (view: string) => void;
}

export function ClerkDashboard({ onNavigate }: ClerkDashboardProps) {
  const [activeView, setActiveView] = useState('dashboard');
  const [activeForm, setActiveForm] = useState<string | null>(null);
  const [vanProducts, setVanProducts] = useState<Array<{product: string, qty: number}>>([]);
  const [stockProducts, setStockProducts] = useState<Array<{product: string, qty: number, expiry: string}>>([]);

  const lowStockItems = [
    { product: 'Alovera Shampoo', current: 45, min: 100 },
    { product: 'Carrot Face Wash', current: 23, min: 50 },
    { product: 'Black Hena', current: 32, min: 80 },
  ];

  const agingData = [
    { id: 'C001', name: 'ABC Retail', days0_30: 25000, days31_45: 15000, days46_60: 8000, daysOver60: 12000, total: 60000 },
    { id: 'C008', name: 'Old Store', days0_30: 0, days31_45: 5000, days46_60: 18000, daysOver60: 35000, total: 58000 },
    { id: 'C003', name: 'Best Shop', days0_30: 10000, days31_45: 8000, days46_60: 15000, daysOver60: 8000, total: 41000 },
    { id: 'C005', name: 'Quick Mart', days0_30: 20000, days31_45: 12000, days46_60: 0, daysOver60: 5000, total: 37000 },
  ].sort((a, b) => b.daysOver60 - a.daysOver60);

  const invoiceData = [
    { invoiceNo: 'INV-001', customer: 'ABC Retail', route: 'Kiribathgoda', total: 45000 },
    { invoiceNo: 'INV-002', customer: 'XYZ Store', route: 'Nugegoda', total: 38000 },
    { invoiceNo: 'INV-003', customer: 'Best Shop', route: 'Kiribathgoda', total: 52000 },
  ];

  const stockReceivedData = [
    { id: 'P001', product: 'Product A', expiry: '2025-12-31', unitPrice: 250, qty: 100, total: 25000 },
    { id: 'P002', product: 'Product B', expiry: '2025-11-30', unitPrice: 180, qty: 150, total: 27000 },
  ];

  const addVanProduct = () => {
    setVanProducts([...vanProducts, { product: '', qty: 0 }]);
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
              <p className="text-muted-foreground">Good Morning Miss Sanduni</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('alerts')} className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button onClick={() => onNavigate('profile')} className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg">
              <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-white">C</span>
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
          <button 
            onClick={() => setActiveView('payments')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${activeView === 'payments' ? 'bg-blue-900 text-white' : 'hover:bg-gray-100'}`}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Payments
          </button>
          <button 
            onClick={() => setActiveView('stock')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${activeView === 'stock' ? 'bg-blue-900 text-white' : 'hover:bg-gray-100'}`}
          >
            <ClipboardList className="w-4 h-4 inline mr-2" />
            Stock Received
          </button>
          <button 
            onClick={() => setActiveView('invoice')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${activeView === 'invoice' ? 'bg-blue-900 text-white' : 'hover:bg-gray-100'}`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Invoice
          </button>
          <button onClick={() => onNavigate('reports')} className="px-4 py-2 hover:bg-gray-100 rounded-lg whitespace-nowrap">
            <FileText className="w-4 h-4 inline mr-2" />
            Reports
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6 max-w-[1400px] mx-auto">
        {activeView === 'dashboard' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <KPICard
                title="Pending Customer Payments"
                value="LKR 1,240,000"
                icon={CreditCard}
                iconColor="bg-orange-100 text-orange-600"
              />
              <KPICard
                title="Low Stock Items"
                value="8"
                icon={PackageX}
                iconColor="bg-red-100 text-red-600"
              />
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-muted-foreground mb-2">Upcoming Cheque Due</p>
                      <h3 className="mb-2">LKR 25,000</h3>
                      <p className="text-orange-600">Oct 25, 2025</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                      <Calendar className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Dialog open={activeForm === 'cheque'} onOpenChange={(open) => setActiveForm(open ? 'cheque' : null)}>
                    <DialogTrigger asChild>
                      <Button className="h-auto py-6 flex flex-col gap-2 bg-blue-900 hover:bg-blue-800">
                        <DollarSign className="w-6 h-6" />
                        Record Manufacturer Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Record Manufacturer Payment (Cheque)</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Cheque No</Label>
                          <Input placeholder="Enter cheque number" />
                        </div>
                        <div className="space-y-2">
                          <Label>Due Date</Label>
                          <Input type="date" />
                        </div>
                        <div className="space-y-2">
                          <Label>Amount (LKR)</Label>
                          <Input type="number" placeholder="Enter amount" />
                        </div>
                        <div className="space-y-2">
                          <Label>Manufacturer Invoice No</Label>
                          <Input placeholder="Enter invoice number" />
                        </div>
                        <Button className="w-full bg-blue-900 hover:bg-blue-800">Submit</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={activeForm === 'payment'} onOpenChange={(open) => setActiveForm(open ? 'payment' : null)}>
                    <DialogTrigger asChild>
                      <Button className="h-auto py-6 flex flex-col gap-2 bg-green-600 hover:bg-green-700">
                        <CreditCard className="w-6 h-6" />
                        Record Customer Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Record Customer Payment</DialogTitle>
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
                        <div className="space-y-2">
                          <Label>Order ID</Label>
                          <Input type="text" placeholder="Enter order ID" />
                        </div>
                        <div className="space-y-2">
                          <Label>Amount (LKR)</Label>
                          <Input type="number" placeholder="Enter amount" />
                        </div>
                        <div className="space-y-2">
                          <Label>Payment Type</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                              <SelectItem value="online">Online Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full bg-blue-900 hover:bg-blue-800">Submit</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={activeForm === 'van'} onOpenChange={(open) => setActiveForm(open ? 'van' : null)}>
                    <DialogTrigger asChild>
                      <Button className="h-auto py-6 flex flex-col gap-2 bg-purple-600 hover:bg-purple-700">
                        <Truck className="w-6 h-6" />
                        Top Up Items to Van
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Top Up Items to Van</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Area</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select area" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="area1">Kiribathgoda</SelectItem>
                              <SelectItem value="area2">Area 2</SelectItem>
                              <SelectItem value="area3">Area 3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {vanProducts.map((item, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
                            <div className="space-y-2">
                              <Label>Product</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="product-a">Product A</SelectItem>
                                  <SelectItem value="product-b">Product B</SelectItem>
                                  <SelectItem value="product-c">Product C</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Quantity</Label>
                              <Input type="number" placeholder="Enter quantity" />
                            </div>
                          </div>
                        ))}

                        <Button onClick={addVanProduct} variant="outline" className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Product
                        </Button>

                        <div className="flex gap-3">
                          <Button className="flex-1 bg-blue-900 hover:bg-blue-800">Confirm</Button>
                          <Button onClick={() => {setActiveForm(null); setVanProducts([]);}} variant="outline" className="flex-1">Cancel</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Low Stock Items */}
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alert</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p>{item.product}</p>
                        <p className="text-muted-foreground">Current: {item.current} | Min: {item.min}</p>
                      </div>
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full">Low</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeView === 'payments' && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Customer Payments (Aging)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>0-30 Days</TableHead>
                    <TableHead>31-45 Days</TableHead>
                    <TableHead>46-60 Days</TableHead>
                    <TableHead>&gt;60 Days</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agingData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>LKR {row.days0_30.toLocaleString()}</TableCell>
                      <TableCell>LKR {row.days31_45.toLocaleString()}</TableCell>
                      <TableCell>LKR {row.days46_60.toLocaleString()}</TableCell>
                      <TableCell className="text-red-600">LKR {row.daysOver60.toLocaleString()}</TableCell>
                      <TableCell>LKR {row.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeView === 'stock' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="mb-2">Stock Received</CardTitle>
                <div className="flex gap-4 text-sm">
                  <span>Invoice No: <strong>MFG-2025-001</strong></span>
                  <span>Date: <strong>2025-10-19</strong></span>
                  <span>Area Name: <strong>Area 1</strong></span>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-blue-900 hover:bg-blue-800">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product Received
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Product Received</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Product</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="product-a">Product A</SelectItem>
                          <SelectItem value="product-b">Product B</SelectItem>
                          <SelectItem value="product-c">Product C</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input type="number" placeholder="Enter quantity" />
                    </div>
                    <div className="space-y-2">
                      <Label>Expiry Date</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Invoice No</Label>
                      <Input placeholder="Enter invoice number" />
                    </div>
                    <Button className="w-full bg-blue-900 hover:bg-blue-800">Add to List</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Unit Price (LKR)</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Total Price (LKR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockReceivedData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.product}</TableCell>
                      <TableCell>{row.expiry}</TableCell>
                      <TableCell>{row.unitPrice.toLocaleString()}</TableCell>
                      <TableCell>{row.qty}</TableCell>
                      <TableCell>{row.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-6 flex justify-end">
                <Button className="bg-green-600 hover:bg-green-700">
                  Confirm Stock Received
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeView === 'invoice' && (
          <Card>
            <CardHeader>
              <CardTitle>Invoice Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Area</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="area1">Area 1</SelectItem>
                      <SelectItem value="area2">Area 2</SelectItem>
                      <SelectItem value="area3">Area 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Total (LKR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.invoiceNo}</TableCell>
                      <TableCell>{row.customer}</TableCell>
                      <TableCell>{row.route}</TableCell>
                      <TableCell>LKR {row.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
