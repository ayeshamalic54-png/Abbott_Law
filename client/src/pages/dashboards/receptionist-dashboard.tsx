import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Users, ClipboardList, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function ReceptionistDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/receptionist'],
  });

  const statCards = [
    { title: "New Inquiries", value: stats?.newInquiries || 0, icon: UserPlus, description: "This week", color: "from-blue-500 to-cyan-600" },
    { title: "Total Visitors", value: stats?.totalVisitors || 0, icon: Users, description: "Today", color: "from-green-500 to-emerald-600" },
  ];

  const quickActions = [
    { label: "Create Inquiry", href: "/admissions/inquiries/add", icon: UserPlus, color: "from-blue-500 to-cyan-600" },
    { label: "Add Visitor", href: "/visitors/add", icon: ClipboardList, color: "from-purple-500 to-pink-600" },
    { label: "View Students", href: "/students", icon: Users, color: "from-green-500 to-emerald-600" },
    { label: "Notifications", href: "/notifications", icon: Bell, color: "from-orange-500 to-red-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent" data-testid="heading-dashboard">
            Receptionist Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">Front desk operations overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {statCards.map((card) => (
            <Card key={card.title} className="group relative overflow-hidden border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-1" data-testid={`card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-heading font-semibold text-slate-700 dark:text-slate-200">{card.title}</CardTitle>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} shadow-lg transform transition-transform duration-300 group-hover:scale-110`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-heading font-bold text-slate-900 dark:text-white mb-1">{card.value}</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="font-heading text-slate-900 dark:text-white">Quick Actions</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Common front desk tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <Button variant="outline" className={`group h-auto w-full flex-col gap-2 py-5 border-2 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-br ${action.color} bg-clip-padding border-transparent text-white hover:opacity-90`} data-testid={`button-${action.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    <action.icon className="h-6 w-6" />
                    <span className="text-xs font-semibold">{action.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Inquiries */}
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="font-heading text-slate-900 dark:text-white">Recent Inquiries</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Latest admission inquiries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-600 dark:text-slate-400 text-center py-8">
              No recent inquiries
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
