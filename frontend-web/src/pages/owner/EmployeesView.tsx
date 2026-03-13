import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/form-components";
import { UserPlus, AlertTriangle, Search, X } from "lucide-react";
import employeeService, { Employee } from "../../services/employeeService";

export default function EmployeesView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [employeeToUpdate, setEmployeeToUpdate] = useState<{
    id: number;
    name: string;
    currentStatus: boolean;
  } | null>(null);

  // Form states
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    username: '',
    password: '',
    role: 'Sales Representative' as 'Owner' | 'Clerk' | 'Sales Representative',
    email: '',
    contact: ''
  });

  // Load employees on mount
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.getAllEmployees();
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadEmployees();
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.searchEmployees(searchTerm);
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || 'Failed to search employees');
      console.error('Error searching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const openConfirmationDialog = (employee: Employee) => {
    setEmployeeToUpdate({
      id: employee.employee_id,
      name: employee.name,
      currentStatus: employee.is_active
    });
    setShowConfirmDialog(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!employeeToUpdate) return;
    
    try {
      setError(null);
      
      if (employeeToUpdate.currentStatus) {
        await employeeService.deactivateEmployee(employeeToUpdate.id);
      } else {
        await employeeService.activateEmployee(employeeToUpdate.id);
      }
      
      // Reload employees to get updated data
      await loadEmployees();
      
      // Show success message (optional - you can add a toast notification here)
      console.log(`Employee ${employeeToUpdate.currentStatus ? 'deactivated' : 'activated'} successfully`);
    } catch (err: any) {
      setError(err.message || `Failed to ${employeeToUpdate.currentStatus ? 'deactivate' : 'activate'} employee`);
      console.error('Error updating employee status:', err);
    } finally {
      // Close dialog and reset
      setShowConfirmDialog(false);
      setEmployeeToUpdate(null);
    }
  };

  const handleAddEmployee = async () => {
    try {
      setError(null);
      
      // Validate form
      if (!newEmployee.name || !newEmployee.email || !newEmployee.username || !newEmployee.password) {
        setError('Please fill in all required fields');
        return;
      }

      await employeeService.createEmployee(newEmployee);
      
      // Reload employees
      await loadEmployees();
      
      // Close dialog and reset form
      setShowAddEmployee(false);
      setNewEmployee({
        name: '',
        username: '',
        password: '',
        role: 'Sales Representative',
        email: '',
        contact: ''
      });
      
      // Show success message (optional)
      console.log('Employee created successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to create employee');
      console.error('Error creating employee:', err);
    }
  };

  const resetForm = () => {
    setNewEmployee({
      name: '',
      username: '',
      password: '',
      role: 'Sales Representative',
      email: '',
      contact: ''
    });
    setError(null);
  };

  const handleCloseAddDialog = () => {
    setShowAddEmployee(false);
    resetForm();
  };

  // Helper function to get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Owner':
        return 'bg-purple-100 text-purple-900';
      case 'Clerk':
        return 'bg-pink-100 text-pink-700';
      case 'Sales Representative':
        return 'bg-blue-100 text-blue-900';
      default:
        return 'bg-gray-100 text-gray-900';
    }
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
          {/* Search Bar */}
          <div className="mb-6 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search employees by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              Search
            </Button>
            {searchTerm && (
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  loadEmployees();
                }} 
                variant="ghost"
                className="px-3"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact No</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee) => (
                    <TableRow key={employee.employee_id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.username}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(employee.role)}`}>
                          {employee.role}
                        </span>
                      </TableCell>
                      <TableCell>{employee.contact || 'N/A'}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          employee.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => openConfirmationDialog(employee)}
                          variant={employee.is_active ? "outline" : "default"}
                          className={employee.is_active
                            ? "border-red-500 text-red-600 hover:bg-red-50"
                            : "bg-green-600 hover:bg-green-700 text-white"
                          }
                        >
                          {employee.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
          </DialogHeader>

          {employeeToUpdate && (
            <div className="space-y-4">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <p className="text-lg font-medium text-gray-900">
                  {employeeToUpdate.currentStatus ? 'Deactivate' : 'Activate'} Employee
                </p>
                <p className="text-gray-600 mt-2">
                  Are you sure you want to {employeeToUpdate.currentStatus ? 'deactivate' : 'activate'}
                  <span className="font-semibold"> {employeeToUpdate.name}</span>?
                </p>
                <p className="text-sm text-gray-500 mt-3">
                  {employeeToUpdate.currentStatus
                    ? 'This employee will lose access to the system.'
                    : 'This employee will regain access to the system.'
                  }
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowConfirmDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmStatusChange}
                  className={`flex-1 ${employeeToUpdate.currentStatus
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                  {employeeToUpdate.currentStatus ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={showAddEmployee} onOpenChange={handleCloseAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          
          {/* Error message in dialog */}
          {error && (
            <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                placeholder="Enter employee name"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                placeholder="Enter username"
                value={newEmployee.username}
                onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                placeholder="Enter password"
                value={newEmployee.password}
                onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
              />
              <p className="text-xs text-gray-500">Minimum 6 characters</p>
            </div>
            
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="Enter email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Contact</Label>
              <Input
                placeholder="Enter contact number"
                value={newEmployee.contact}
                onChange={(e) => setNewEmployee({ ...newEmployee, contact: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Role *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({ 
                  ...newEmployee, 
                  role: e.target.value as 'Owner' | 'Clerk' | 'Sales Representative' 
                })}
              >
                <option value="Sales Representative">Sales Representative</option>
                <option value="Clerk">Clerk</option>
                <option value="Owner">Owner</option>
              </select>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAddEmployee}
                className="flex-1 bg-blue-900 hover:bg-blue-800"
              >
                Create Employee
              </Button>
              <Button
                onClick={handleCloseAddDialog}
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