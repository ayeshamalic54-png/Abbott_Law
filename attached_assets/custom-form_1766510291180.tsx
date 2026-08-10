import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, FormInput, CheckSquare, ChevronDown, Calendar, Hash, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const fieldTypes = [
  { value: "text", label: "Text Input", icon: FormInput },
  { value: "number", label: "Number", icon: Hash },
  { value: "email", label: "Email", icon: FormInput },
  { value: "phone", label: "Phone", icon: FormInput },
  { value: "textarea", label: "Long Text", icon: FileText },
  { value: "dropdown", label: "Dropdown", icon: ChevronDown },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare },
  { value: "date", label: "Date Picker", icon: Calendar },
];

const customFieldSchema = z.object({
  fieldName: z.string().min(1, "Field name is required"),
  fieldLabel: z.string().min(1, "Field label is required"),
  fieldType: z.string().min(1, "Field type is required"),
  isRequired: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.string().optional(),
  helpText: z.string().optional(),
});

type CustomField = z.infer<typeof customFieldSchema> & {
  id: string;
  order: number;
};

export default function CustomAdmissionForm() {
  const [open, setOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  // Mock data - in real app, this would come from API
  const [customFields, setCustomFields] = useState<CustomField[]>([
    {
      id: "1",
      fieldName: "guardian_occupation",
      fieldLabel: "Guardian's Occupation",
      fieldType: "text",
      isRequired: true,
      placeholder: "Enter guardian's occupation",
      order: 1,
    },
    {
      id: "2",
      fieldName: "emergency_contact",
      fieldLabel: "Emergency Contact Number",
      fieldType: "phone",
      isRequired: true,
      placeholder: "+92-XXX-XXXXXXX",
      helpText: "Enter a secondary contact number for emergencies",
      order: 2,
    },
    {
      id: "3",
      fieldName: "previous_institution",
      fieldLabel: "Previous Educational Institution",
      fieldType: "text",
      isRequired: false,
      placeholder: "Name of your previous school/college",
      order: 3,
    },
    {
      id: "4",
      fieldName: "transport_required",
      fieldLabel: "Require College Transport?",
      fieldType: "dropdown",
      isRequired: true,
      options: "Yes,No",
      order: 4,
    },
  ]);

  const form = useForm<z.infer<typeof customFieldSchema>>({
    resolver: zodResolver(customFieldSchema),
    defaultValues: {
      fieldName: "",
      fieldLabel: "",
      fieldType: "",
      isRequired: false,
      placeholder: "",
      options: "",
      helpText: "",
    },
  });

  const onSubmit = (data: z.infer<typeof customFieldSchema>) => {
    if (editingField) {
      // Update existing field
      setCustomFields(customFields.map(f => 
        f.id === editingField.id 
          ? { ...data, id: f.id, order: f.order } 
          : f
      ));
      toast({
        title: "Success",
        description: "Custom field updated successfully",
      });
    } else {
      // Add new field
      const newField: CustomField = {
        ...data,
        id: Date.now().toString(),
        order: customFields.length + 1,
      };
      setCustomFields([...customFields, newField]);
      toast({
        title: "Success",
        description: "Custom field added successfully",
      });
    }
    setOpen(false);
    setEditingField(null);
    form.reset();
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    form.reset({
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      isRequired: field.isRequired,
      placeholder: field.placeholder || "",
      options: field.options || "",
      helpText: field.helpText || "",
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this custom field?")) {
      setCustomFields(customFields.filter(f => f.id !== id));
      toast({
        title: "Success",
        description: "Custom field deleted successfully",
      });
    }
  };

  const getFieldTypeIcon = (type: string) => {
    const fieldType = fieldTypes.find(ft => ft.value === type);
    return fieldType?.icon || FormInput;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-custom-form">
            Custom Admission Form Builder
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage additional fields for the admission form
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={previewMode ? "default" : "outline"}
            onClick={() => setPreviewMode(!previewMode)}
            data-testid="button-preview"
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? "Edit Mode" : "Preview Form"}
          </Button>
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditingField(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0 shadow-lg"
                data-testid="button-add-field"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Field
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingField ? "Edit Custom Field" : "Add Custom Field"}
                </DialogTitle>
                <DialogDescription>
                  {editingField 
                    ? "Update the custom field configuration" 
                    : "Add a new field to the admission form"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fieldName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field Name (Database) *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., guardian_occupation" 
                              {...field}
                              data-testid="input-field-name"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Use lowercase with underscores (snake_case)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fieldLabel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field Label (Display) *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Guardian's Occupation" 
                              {...field}
                              data-testid="input-field-label"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            What users will see on the form
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="fieldType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-field-type">
                              <SelectValue placeholder="Select field type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {fieldTypes.map((type) => {
                              const Icon = type.icon;
                              return (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="placeholder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placeholder Text</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Enter your answer here" 
                            {...field}
                            data-testid="input-placeholder"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Hint text shown inside the input field
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("fieldType") === "dropdown" && (
                    <FormField
                      control={form.control}
                      name="options"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dropdown Options *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Option1,Option2,Option3" 
                              {...field}
                              data-testid="textarea-options"
                              rows={3}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Enter options separated by commas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="helpText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Help Text</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional instructions or help for this field" 
                            {...field}
                            data-testid="textarea-help"
                            rows={2}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Additional guidance shown below the field
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Required Field</FormLabel>
                          <FormDescription>
                            Students must fill this field to submit the form
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-required"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setOpen(false);
                        setEditingField(null);
                        form.reset();
                      }}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" data-testid="button-save">
                      {editingField ? "Update Field" : "Add Field"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!previewMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Custom Form Fields</CardTitle>
            <CardDescription>
              Manage additional fields that will appear on the admission form
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customFields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FormInput className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No custom fields added yet</p>
                <p className="text-sm">Click "Add Custom Field" to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Field Name</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customFields.map((field) => {
                    const Icon = getFieldTypeIcon(field.fieldType);
                    return (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">{field.order}</TableCell>
                        <TableCell className="font-mono text-sm">{field.fieldName}</TableCell>
                        <TableCell>{field.fieldLabel}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            {fieldTypes.find(ft => ft.value === field.fieldType)?.label}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={field.isRequired ? "default" : "secondary"}>
                            {field.isRequired ? "Required" : "Optional"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(field)}
                              data-testid={`button-edit-${field.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(field.id)}
                              data-testid={`button-delete-${field.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Form Preview</CardTitle>
            <CardDescription>
              This is how the custom fields will appear on the admission form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-2xl">
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> These fields will appear after the standard admission form fields
                  (Name, Father's Name, CNIC, etc.)
                </p>
              </div>
              
              {customFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="text-sm font-medium">
                    {field.fieldLabel}
                    {field.isRequired && <span className="text-destructive ml-1">*</span>}
                  </label>
                  
                  {field.fieldType === "textarea" ? (
                    <Textarea 
                      placeholder={field.placeholder} 
                      disabled
                      rows={4}
                    />
                  ) : field.fieldType === "dropdown" ? (
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.split(',').map((opt, idx) => (
                          <SelectItem key={idx} value={opt.trim()}>
                            {opt.trim()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.fieldType === "checkbox" ? (
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" disabled className="h-4 w-4" />
                      <span className="text-sm">{field.placeholder || "Check if applicable"}</span>
                    </div>
                  ) : (
                    <Input 
                      type={field.fieldType} 
                      placeholder={field.placeholder}
                      disabled
                    />
                  )}
                  
                  {field.helpText && (
                    <p className="text-xs text-muted-foreground">{field.helpText}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
