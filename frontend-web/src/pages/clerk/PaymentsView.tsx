// frontend-web/src/pages/clerk/PaymentsView.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/form-components";
import { DollarSign } from "lucide-react";

export default function PaymentsView() {
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const [paymentType, setPaymentType] = useState<'customer' | 'manufacturer'>('customer');

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Payment Management</CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                setPaymentType('customer');
                setShowRecordPayment(true);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Record Customer Payment
            </Button>
            <Button 
              onClick={() => {
                setPaymentType('manufacturer');
                setShowRecordPayment(true);
              }}
              variant="outline"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Record Manufacturer Payment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Customer Payments</h3>
              <p className="text-2xl font-bold text-green-600">LKR 125,000</p>
              <p className="text-sm text-gray-600 mt-1">Collected today</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Manufacturer Payments</h3>
              <p className="text-2xl font-bold text-blue-600">LKR 85,000</p>
              <p className="text-sm text-gray-600 mt-1">Pending this week</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={showRecordPayment} onOpenChange={setShowRecordPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Record {paymentType === 'customer' ? 'Customer' : 'Manufacturer'} Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Amount (LKR)</Label>
              <Input type="number" placeholder="Enter amount" />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button className="flex-1 bg-blue-900 hover:bg-blue-800">Confirm</Button>
              <Button onClick={() => setShowRecordPayment(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}