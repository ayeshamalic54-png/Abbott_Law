import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Check, X } from "lucide-react";

type Permission = {
  role: string;
  permissions: {
    students: boolean;
    staff: boolean;
    admissions: boolean;
    fees: boolean;
    accounts: boolean;
    library: boolean;
    attendance: boolean;
    reports: boolean;
    settings: boolean;
  };
};

const rolePermissions: Permission[] = [
  {
    role: 'Admin',
    permissions: {
      students: true,
      staff: true,
      admissions: true,
      fees: true,
      accounts: true,
      library: true,
      attendance: true,
      reports: true,
      settings: true,
    }
  },
  {
    role: 'Accountant',
    permissions: {
      students: false,
      staff: false,
      admissions: false,
      fees: true,
      accounts: true,
      library: false,
      attendance: false,
      reports: true,
      settings: false,
    }
  },
  {
    role: 'Receptionist',
    permissions: {
      students: true,
      staff: false,
      admissions: true,
      fees: false,
      accounts: false,
      library: false,
      attendance: false,
      reports: false,
      settings: false,
    }
  },
  {
    role: 'Teacher',
    permissions: {
      students: true,
      staff: false,
      admissions: false,
      fees: false,
      accounts: false,
      library: false,
      attendance: true,
      reports: true,
      settings: false,
    }
  },
  {
    role: 'Library Staff',
    permissions: {
      students: false,
      staff: false,
      admissions: false,
      fees: false,
      accounts: false,
      library: true,
      attendance: false,
      reports: false,
      settings: false,
    }
  },
  {
    role: 'Hazara University',
    permissions: {
      students: false,
      staff: false,
      admissions: false,
      fees: false,
      accounts: false,
      library: false,
      attendance: true,
      reports: true,
      settings: false,
    }
  },
];

export default function PermissionControl() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-permission-control">Permission Control</h1>
          <p className="text-muted-foreground">View role-based access permissions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions Matrix</CardTitle>
          <CardDescription>System-wide access control for each user role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left p-3 font-semibold">Role</th>
                  <th className="text-center p-3 font-semibold">Students</th>
                  <th className="text-center p-3 font-semibold">Staff</th>
                  <th className="text-center p-3 font-semibold">Admissions</th>
                  <th className="text-center p-3 font-semibold">Fees</th>
                  <th className="text-center p-3 font-semibold">Accounts</th>
                  <th className="text-center p-3 font-semibold">Library</th>
                  <th className="text-center p-3 font-semibold">Attendance</th>
                  <th className="text-center p-3 font-semibold">Reports</th>
                  <th className="text-center p-3 font-semibold">Settings</th>
                </tr>
              </thead>
              <tbody>
                {rolePermissions.map((roleData) => (
                  <tr key={roleData.role} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <Badge variant="outline" className="font-semibold">
                        {roleData.role}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      {roleData.permissions.students ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {roleData.permissions.staff ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {roleData.permissions.admissions ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {roleData.permissions.fees ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {roleData.permissions.accounts ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {roleData.permissions.library ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {roleData.permissions.attendance ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {roleData.permissions.reports ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {roleData.permissions.settings ? (
                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Role-Based Access Control</h3>
              <p className="text-sm text-blue-700 mt-1">
                Permissions are enforced system-wide. Users can only access features their role permits. Contact an administrator to modify role permissions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
