// frontend-web/src/pages/owner/EmployeesView.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/form-components";
import { UserPlus } from "lucide-react";

// TODO: Replace with API calls
const initialEmployeeData = [
  { id: 1, name: 'Kasun Perera', role: 'Sales Representative', contact: '+94 77 123 4567', email: 'kasun@manjula.lk', isActive: true },
  { id: 2, name: 'Nimal Silva', role: 'Sales Representative', contact: '+94 77 234 5678', email: 'nimal@manjula.lk', isActive: true },
  { id: 3, name: 'Ruwan Fernando', role: 'Sales Representative', contact: '+94 77 345 6789', email: 'ruwan@manjula.lk', isActive: false },
  { id: 4, name: 'Priya Jayasinghe', role: 'Clerk', contact: '+94 77 456 7890', email: 'priya@manjula.lk', isActive: true },
  { id: 5, name: 'Sanduni Wickramasinghe', role: 'Clerk', contact: '+94 77 567 8901', email: 'sanduni@manjula.lk', isActive: true },
];

export default function EmployeesView() {
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [employees, setEmployees] = useState(initialEmployeeData);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    username: '',
    password: '',
    role: 'Sales Representative',
    email: '',
    contact: ''
  });

  const toggleEmployeeStatus = (id: number) => {
    // TODO: Call API to update employee status
    setEmployees(prevEmployees => 
      prevEmployees.map(emp => 
        emp.id === id ? { ...emp, isActive: !emp.isActive } : emp
      )
    );
  };

  const handleAddEmployee = () => {
    // TODO: Call API to create employee
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
    
    // Reset form
    setNewEmployee({
      name: '',
      username: '',
      password: '',
      role: 'Sales Representative',
      email: '',
      contact: ''
    });
  };

  return (
    <>
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
    </>
  );
}