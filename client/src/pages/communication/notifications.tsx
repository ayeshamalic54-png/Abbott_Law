import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Notification } from "@shared/schema";

export default function Notifications() {
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });

  const getTypeBadge = (type: string) => {
    const types = {
      announcement: { label: 'Announcement', variant: 'default' as const },
      fee_reminder: { label: 'Fee Reminder', variant: 'secondary' as const },
      general: { label: 'General', variant: 'outline' as const },
    };
    return types[type as keyof typeof types] || types.general;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="heading-notifications">Notifications</h1>
          <p className="text-muted-foreground">View and manage announcements</p>
        </div>
        <Button data-testid="button-add-notification">
          <Plus className="h-4 w-4 mr-2" />
          Create Notification
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notifications available</p>
                <p className="text-sm text-muted-foreground mt-1">Create announcements to keep everyone informed</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} data-testid={`card-notification-${notification.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg" data-testid={`text-title-${notification.id}`}>
                        {notification.title}
                      </CardTitle>
                      <Badge variant={getTypeBadge(notification.type || 'general').variant}>
                        {getTypeBadge(notification.type || 'general').label}
                      </Badge>
                      {notification.isActive && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm" data-testid={`text-message-${notification.id}`}>
                      {notification.message}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <span>Target: {notification.targetRole || 'All Users'}</span>
                  <span>•</span>
                  <span>{new Date(notification.createdAt!).toLocaleDateString()}</span>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
