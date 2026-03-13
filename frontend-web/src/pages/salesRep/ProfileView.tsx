// frontend-web/src/pages/sales/ProfileView.tsx
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input, Label } from "../../components/ui/form-components";
import { useAuth } from "../../context/AuthContext";

export default function ProfileView() {
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={user?.name || ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={user?.role || ''} readOnly />
          </div>
          <div className="pt-4">
            <Button variant="outline">Change Password</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}