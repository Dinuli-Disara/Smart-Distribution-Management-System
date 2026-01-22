// frontend-web/src/pages/owner/InventoryView.tsx
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

// TODO: Replace with API calls
const inventoryData = [
  { id: 'P001', product: 'King Coconut Shampoo 200ml', unitPrice: 550, qtyStore: 450, qtyVans: 50 },
  { id: 'P002', product: 'King Coconut Conditioner 200ml', unitPrice: 580, qtyStore: 320, qtyVans: 45 },
  { id: 'P003', product: 'Black Henna', unitPrice: 320, qtyStore: 580, qtyVans: 220 },
  { id: 'P004', product: 'Hand Wash Rose 500ml', unitPrice: 850, qtyStore: 290, qtyVans: 95 },
  { id: 'P005', product: 'Hand Wash Lemon 500ml', unitPrice: 850, qtyStore: 720, qtyVans: 80 },
];

export default function InventoryView() {
  return (
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
              <TableHead>Total Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventoryData.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.product}</TableCell>
                <TableCell>LKR {item.unitPrice.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={item.qtyStore < 100 ? 'text-red-600 font-semibold' : ''}>
                    {item.qtyStore}
                  </span>
                </TableCell>
                <TableCell>{item.qtyVans}</TableCell>
                <TableCell className="font-semibold">{item.qtyStore + item.qtyVans}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Low Stock Warning */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">Note:</span> Items with store quantity less than 100 are highlighted in red.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}