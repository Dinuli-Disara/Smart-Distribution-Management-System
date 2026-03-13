// frontend-web/src/pages/sales/StockView.tsx
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

export default function StockView() {
  const stockItems = [
    { id: 1, name: 'Shampoo 200ml', code: 'SH-001', quantity: 45, status: 'In Stock' },
    { id: 2, name: 'Conditioner 200ml', code: 'CO-001', quantity: 12, status: 'Low Stock' },
    { id: 3, name: 'Face Wash 100ml', code: 'FW-001', quantity: 0, status: 'Out of Stock' },
    { id: 4, name: 'Body Lotion 250ml', code: 'BL-001', quantity: 28, status: 'In Stock' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Van Stock</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Code</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-right">
                  <span className={
                    item.quantity === 0 ? 'text-red-600 font-semibold' :
                    item.quantity < 20 ? 'text-yellow-600 font-semibold' :
                    'text-gray-900'
                  }>
                    {item.quantity}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === 'In Stock' ? 'bg-green-100 text-green-700' :
                    item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}