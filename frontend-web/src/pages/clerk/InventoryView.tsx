// frontend-web/src/pages/clerk/InventoryView.tsx
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Plus } from "lucide-react";

export default function InventoryView() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Inventory Management</CardTitle>
        <div className="flex gap-2">
          <Button className="bg-blue-900 hover:bg-blue-800">
            <Plus className="w-4 h-4 mr-2" />
            Receive Stock
          </Button>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Transfer to Van
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Inventory management interface coming soon...</p>
      </CardContent>
    </Card>
  );
}