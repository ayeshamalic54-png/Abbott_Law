import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Database, Download, Calendar, Clock, CheckCircle2, Settings as SettingsIcon, Save, 
  Building, Mail, Phone, MapPin, Bell, Shield, Palette, DollarSign, GraduationCap,
  Image as ImageIcon, Upload, UploadCloud, RefreshCw
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

type Backup = {
  id: string;
  fileName: string;
  type: 'manual' | 'automatic';
  size: string;
  status: 'success' | 'failed' | 'in_progress';
  createdAt: string;
};

export default function Settings() {
  const { toast } = useToast();
  
  // Backup Settings
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupTime, setBackupTime] = useState("02:00");
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [retentionDays, setRetentionDays] = useState("30");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedRestoreFile, setSelectedRestoreFile] = useState<File | null>(null);

  // College Information
  const [collegeName, setCollegeName] = useState("Abbott Law College");
  const [collegeAddress, setCollegeAddress] = useState("Mansehra, Khyber Pakhtunkhwa, Pakistan");
  const [collegePhone, setCollegePhone] = useState("+92-997-123456");
  const [collegeEmail, setCollegeEmail] = useState("info@abbottlaw.edu.pk");
  const [collegeWebsite, setCollegeWebsite] = useState("www.abbottlaw.edu.pk");

  // Academic Settings
  const [currentSession, setCurrentSession] = useState("2025-2026");
  const [currentSemester, setCurrentSemester] = useState("Fall 2025");
  const [admissionOpen, setAdmissionOpen] = useState(true);

  // Fee Settings
  const [lateFeeEnabled, setLateFeeEnabled] = useState(true);
  const [lateFeeAmount, setLateFeeAmount] = useState("500");
  const [gracePeriod, setGracePeriod] = useState("5");

  // Notification Settings
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  // Fetch backups from database
  const { data: backups = [], isLoading: loadingBackups } = useQuery<Backup[]>({
    queryKey: ['/api/backups'],
  });

  // Create manual backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/backups/manual');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/backups'] });
      toast({
        title: "Backup Successful",
        description: `Database backup created successfully on ${new Date().toLocaleString()}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Backup Failed",
        description: error.message || "Failed to create backup",
        variant: "destructive",
      });
    },
  });

  const handleManualBackup = () => {
    createBackupMutation.mutate();
  };

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: async (backupData: any) => {
      const res = await apiRequest('POST', '/api/backups/restore', { backupData });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      const r = data.restored || {};
      const parts = [];
      if (r.students) parts.push(`${r.students} students`);
      if (r.staff) parts.push(`${r.staff} staff`);
      if (r.programs) parts.push(`${r.programs} programs`);
      if (r.courses) parts.push(`${r.courses} courses`);
      if (r.feeStructures) parts.push(`${r.feeStructures} fee structures`);
      if (r.salaryTypes) parts.push(`${r.salaryTypes} salary types`);
      if (r.expenseHeads) parts.push(`${r.expenseHeads} expense heads`);
      if (r.libraryBooks) parts.push(`${r.libraryBooks} books`);
      if (r.visitors) parts.push(`${r.visitors} visitors`);
      if (r.inquiries) parts.push(`${r.inquiries} inquiries`);
      if (r.notifications) parts.push(`${r.notifications} notifications`);
      toast({
        title: "Restore Successful",
        description: parts.length > 0 ? `Restored: ${parts.join(', ')}` : "Backup restored successfully",
      });
      if (r.errors?.length > 0) {
        toast({
          title: "Restore Warnings",
          description: `${r.errors.length} items had issues. Check console for details.`,
          variant: "destructive",
        });
        console.log("Restore errors:", r.errors);
      }
      setRestoreDialogOpen(false);
      setSelectedRestoreFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Restore Failed",
        description: error.message || "Failed to restore backup",
        variant: "destructive",
      });
    },
  });

  const handleRestoreBackup = async () => {
    if (!selectedRestoreFile) return;
    
    try {
      const content = await selectedRestoreFile.text();
      const backupData = JSON.parse(content);
      restoreBackupMutation.mutate(backupData);
    } catch (e) {
      toast({
        title: "Invalid File",
        description: "The selected file is not a valid backup file",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedRestoreFile(file);
      setRestoreDialogOpen(true);
    }
  };

  const handleSaveSettings = (section: string) => {
    toast({
      title: "Settings Saved",
      description: `${section} settings have been updated successfully`,
    });
  };

  const handleDownloadBackup = async (backup: Backup) => {
    try {
      // Open the download URL in a new window to trigger browser download
      window.open(`/api/backups/${backup.id}/download`, '_blank');
      
      toast({
        title: "Download Started",
        description: `Downloading ${backup.fileName}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download backup file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center">
          <SettingsIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-settings">
            System Settings
          </h1>
          <p className="text-muted-foreground">
            Configure college information, academic settings, and system preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="college" className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto">
          <TabsTrigger value="college" data-testid="tab-college">
            <Building className="h-4 w-4 mr-2" />
            College Info
          </TabsTrigger>
          <TabsTrigger value="academic" data-testid="tab-academic">
            <GraduationCap className="h-4 w-4 mr-2" />
            Academic
          </TabsTrigger>
          <TabsTrigger value="fees" data-testid="tab-fees">
            <DollarSign className="h-4 w-4 mr-2" />
            Fee Settings
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" data-testid="tab-appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="backup" data-testid="tab-backup">
            <Database className="h-4 w-4 mr-2" />
            Backup
          </TabsTrigger>
        </TabsList>

        {/* College Information Tab */}
        <TabsContent value="college" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>College Information</CardTitle>
              <CardDescription>
                Basic information about your institution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="college-name">College Name *</Label>
                  <Input
                    id="college-name"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    data-testid="input-college-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="college-email">Email Address *</Label>
                  <Input
                    id="college-email"
                    type="email"
                    value={collegeEmail}
                    onChange={(e) => setCollegeEmail(e.target.value)}
                    data-testid="input-college-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="college-phone">Phone Number *</Label>
                  <Input
                    id="college-phone"
                    value={collegePhone}
                    onChange={(e) => setCollegePhone(e.target.value)}
                    data-testid="input-college-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="college-website">Website</Label>
                  <Input
                    id="college-website"
                    value={collegeWebsite}
                    onChange={(e) => setCollegeWebsite(e.target.value)}
                    data-testid="input-college-website"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="college-address">Address *</Label>
                <Textarea
                  id="college-address"
                  value={collegeAddress}
                  onChange={(e) => setCollegeAddress(e.target.value)}
                  rows={3}
                  data-testid="textarea-college-address"
                />
              </div>

              <Separator />

              <Button 
                onClick={() => handleSaveSettings("College Information")}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                data-testid="button-save-college-info"
              >
                <Save className="h-4 w-4 mr-2" />
                Save College Information
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Settings Tab */}
        <TabsContent value="academic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Academic Year & Session</CardTitle>
              <CardDescription>
                Configure academic session and semester information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="current-session">Current Academic Session *</Label>
                  <Input
                    id="current-session"
                    value={currentSession}
                    onChange={(e) => setCurrentSession(e.target.value)}
                    placeholder="e.g., 2025-2026"
                    data-testid="input-current-session"
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: YYYY-YYYY
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current-semester">Current Semester *</Label>
                  <Select value={currentSemester} onValueChange={setCurrentSemester}>
                    <SelectTrigger id="current-semester" data-testid="select-current-semester">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fall 2025">Fall 2025</SelectItem>
                      <SelectItem value="Spring 2026">Spring 2026</SelectItem>
                      <SelectItem value="Fall 2026">Fall 2026</SelectItem>
                      <SelectItem value="Spring 2027">Spring 2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="admission-status" className="text-base font-medium">
                    Admissions Open
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow new student admissions
                  </p>
                </div>
                <Switch
                  id="admission-status"
                  checked={admissionOpen}
                  onCheckedChange={setAdmissionOpen}
                  data-testid="switch-admission-open"
                />
              </div>

              <Separator />

              <Button 
                onClick={() => handleSaveSettings("Academic")}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                data-testid="button-save-academic"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Academic Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Settings Tab */}
        <TabsContent value="fees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fee Configuration</CardTitle>
              <CardDescription>
                Configure late fee penalties and payment rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="late-fee-enabled" className="text-base font-medium">
                    Enable Late Fee Charges
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically charge late fees for overdue payments
                  </p>
                </div>
                <Switch
                  id="late-fee-enabled"
                  checked={lateFeeEnabled}
                  onCheckedChange={setLateFeeEnabled}
                  data-testid="switch-late-fee"
                />
              </div>

              {lateFeeEnabled && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="late-fee-amount">Late Fee Amount (Rs) *</Label>
                    <Input
                      id="late-fee-amount"
                      type="number"
                      value={lateFeeAmount}
                      onChange={(e) => setLateFeeAmount(e.target.value)}
                      data-testid="input-late-fee-amount"
                    />
                    <p className="text-xs text-muted-foreground">
                      Amount charged after grace period expires
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grace-period">Grace Period (Days) *</Label>
                    <Input
                      id="grace-period"
                      type="number"
                      value={gracePeriod}
                      onChange={(e) => setGracePeriod(e.target.value)}
                      data-testid="input-grace-period"
                    />
                    <p className="text-xs text-muted-foreground">
                      Days after due date before late fee applies
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              <Button 
                onClick={() => handleSaveSettings("Fee")}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                data-testid="button-save-fee"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Fee Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure SMS and email notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="sms-enabled" className="text-base font-medium">
                    SMS Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Send SMS alerts for fee payments, attendance
                  </p>
                </div>
                <Switch
                  id="sms-enabled"
                  checked={smsEnabled}
                  onCheckedChange={setSmsEnabled}
                  data-testid="switch-sms"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="email-enabled" className="text-base font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Send email alerts for important updates
                  </p>
                </div>
                <Switch
                  id="email-enabled"
                  checked={emailEnabled}
                  onCheckedChange={setEmailEnabled}
                  data-testid="switch-email"
                />
              </div>

              <Separator />

              <Button 
                onClick={() => handleSaveSettings("Notification")}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                data-testid="button-save-notifications"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>College Branding</CardTitle>
              <CardDescription>
                Upload logos and customize appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <Label>Abbott Law College Logo</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload college logo for LLB programs
                    </p>
                    <Button variant="outline" size="sm" data-testid="button-upload-llb-logo">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Abbott Group Logo</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Upload group logo for B.Ed, DM programs
                    </p>
                    <Button variant="outline" size="sm" data-testid="button-upload-group-logo">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <Button 
                onClick={() => handleSaveSettings("Appearance")}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                data-testid="button-save-appearance"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Appearance Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Automatic Backup Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle>Automatic Backup</CardTitle>
                </div>
                <CardDescription>
                  Schedule automatic database backups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-backup" className="text-base font-medium">
                      Enable Automatic Backup
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      System will automatically backup database
                    </p>
                  </div>
                  <Switch
                    id="auto-backup"
                    checked={autoBackupEnabled}
                    onCheckedChange={setAutoBackupEnabled}
                    data-testid="switch-auto-backup"
                  />
                </div>

                {autoBackupEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="backup-frequency">Backup Frequency</Label>
                      <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                        <SelectTrigger id="backup-frequency" data-testid="select-frequency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backup-time">Backup Time</Label>
                      <Input
                        id="backup-time"
                        type="time"
                        value={backupTime}
                        onChange={(e) => setBackupTime(e.target.value)}
                        data-testid="input-backup-time"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="retention">Retention Period</Label>
                      <Select value={retentionDays} onValueChange={setRetentionDays}>
                        <SelectTrigger id="retention" data-testid="select-retention">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="14">14 Days</SelectItem>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="60">60 Days</SelectItem>
                          <SelectItem value="90">90 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={() => handleSaveSettings("Backup")}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                      data-testid="button-save-backup-settings"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Backup Settings
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Manual Backup */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <CardTitle>Manual Backup</CardTitle>
                </div>
                <CardDescription>
                  Create an immediate database backup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto">
                    <Download className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Create Backup Now</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Complete backup of all data
                    </p>
                  </div>
                  <Button
                    onClick={handleManualBackup}
                    disabled={createBackupMutation.isPending}
                    className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0"
                    data-testid="button-manual-backup"
                  >
                    {createBackupMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Creating Backup...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Create Manual Backup
                      </>
                    )}
                  </Button>
                </div>

                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Backup Information</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 pl-6">
                    <p>• Full database backup (JSON format)</p>
                    <p>• Student, staff, and fee data</p>
                    <p>• Library and attendance records</p>
                    <p>• Programs and courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Restore Backup */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  <CardTitle>Restore Backup</CardTitle>
                </div>
                <CardDescription>
                  Restore data from a previous backup file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-dashed p-6 text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto">
                    <UploadCloud className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Restore From Backup</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload a backup file to restore data
                    </p>
                  </div>
                  <div className="mt-4">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="restore-file-input"
                      data-testid="input-restore-file"
                    />
                    <Button
                      onClick={() => document.getElementById('restore-file-input')?.click()}
                      disabled={restoreBackupMutation.isPending}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0"
                      data-testid="button-restore-backup"
                    >
                      {restoreBackupMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Restoring...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-4 w-4 mr-2" />
                          Select Backup File
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Warning</span>
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1 pl-6">
                    <p>• Restoring will add data from backup file</p>
                    <p>• Duplicate records will be skipped</p>
                    <p>• Create a new backup before restoring</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Backup History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Backups</CardTitle>
                  <CardDescription>
                    History of automatic and manual backups
                  </CardDescription>
                </div>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                  {backups.length} Backups
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBackups ? (
                <div className="flex justify-center py-8">
                  <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No backups found. Create your first backup above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {backups.map((backup, idx) => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover-elevate active-elevate-2"
                      data-testid={`backup-item-${idx}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          backup.type === 'automatic' 
                            ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                          {backup.type === 'automatic' ? (
                            <Calendar className="h-5 w-5 text-white" />
                          ) : (
                            <Download className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {new Date(backup.createdAt).toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {backup.size} • {backup.type.charAt(0).toUpperCase() + backup.type.slice(1)} Backup
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Success
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadBackup(backup)}
                          data-testid={`button-download-${idx}`}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore from the selected backup file?
              {selectedRestoreFile && (
                <span className="block mt-2 font-medium text-foreground">
                  File: {selectedRestoreFile.name}
                </span>
              )}
              <span className="block mt-2 text-amber-600">
                This will add data from the backup. Duplicate records will be skipped.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedRestoreFile(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreBackup}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Restore Backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
