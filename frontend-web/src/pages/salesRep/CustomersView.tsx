// frontend-web/src/pages/sales/CustomersView.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/form-components";
import { UserPlus, Search } from "lucide-react";

export default function CustomersView() {
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Customer Management</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search customers..." className="pl-10 w-64" />
            </div>
            <Button onClick={() => setShowAddCustomer(true)} className="bg-blue-900 hover:bg-blue-800">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Customer list and details coming soon...</p>
        </CardContent>
      </Card>

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Shop Name</Label>
              <Input placeholder="Enter shop name" />
            </div>
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input placeholder="Enter contact person name" />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input placeholder="Enter phone number" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="Enter shop address" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button className="flex-1 bg-blue-900 hover:bg-blue-800">Register</Button>
              <Button onClick={() => setShowAddCustomer(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}