// frontend-web/src/pages/sales/ReturnsView.tsx
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Plus } from "lucide-react";

export default function ReturnsView() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Product Returns</CardTitle>
        <Button className="bg-blue-900 hover:bg-blue-800">
          <Plus className="w-4 h-4 mr-2" />
          Record Return
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Return management interface coming soon...</p>
      </CardContent>
    </Card>
  );
}