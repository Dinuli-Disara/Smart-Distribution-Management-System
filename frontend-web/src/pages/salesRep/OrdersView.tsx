// frontend-web/src/pages/sales/OrdersView.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Plus } from "lucide-react";

export default function OrdersView() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Order Management</CardTitle>
        <Button className="bg-blue-900 hover:bg-blue-800">
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Order management interface coming soon...</p>
      </CardContent>
    </Card>
  );
}