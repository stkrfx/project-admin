"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, CalendarCheck, TrendingUp, Brain } from "lucide-react"; // Added Brain
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Mock Data for Revenue Chart
const data = [
  { name: "Mon", total: 120 },
  { name: "Tue", total: 300 },
  { name: "Wed", total: 240 },
  { name: "Thu", total: 450 },
  { name: "Fri", total: 600 },
  { name: "Sat", total: 850 },
  { name: "Sun", total: 400 },
];

// Mock Data for Appointments
const appointments = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    time: "10:00 AM",
    date: "Today",
    amount: "+$150.00",
    status: "Confirmed",
  },
  {
    id: 2,
    name: "Michael Chen",
    email: "m.chen@tech.co",
    time: "2:30 PM",
    date: "Today",
    amount: "+$200.00",
    status: "Pending",
  },
  {
    id: 3,
    name: "Emma Wilson",
    email: "emma.w@design.studio",
    time: "11:00 AM",
    date: "Tomorrow",
    amount: "+$150.00",
    status: "Confirmed",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* 1. Header Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Overview</h2>
        <p className="text-zinc-500">Here&apos;s what&apos;s happening with your expert business.</p>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">$45,231.89</div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" /> 
              <span className="text-emerald-600 font-medium">+20.1%</span> 
              <span className="ml-1">from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Appointments</CardTitle>
            <CalendarCheck className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">+2350</div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" /> 
              <span className="text-emerald-600 font-medium">+180.1%</span> 
              <span className="ml-1">from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">+12,234</div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" /> 
              <span className="text-emerald-600 font-medium">+19%</span> 
              <span className="ml-1">from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Active Now</CardTitle>
            <Brain className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">+573</div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center">
              <span className="text-emerald-600 font-medium">+201</span> 
              <span className="ml-1">since last hour</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Revenue Chart */}
        <Card className="col-span-4 border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-zinc-900">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
                <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="col-span-3 border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-zinc-900">Upcoming Appointments</CardTitle>
            <p className="text-sm text-zinc-500">
              You have 3 appointments scheduled for today.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {appointments.map((apt) => (
                <div key={apt.id} className="flex items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200">
                    <span className="text-xs font-medium text-zinc-600">
                        {apt.name.substring(0,2).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none text-zinc-900">{apt.name}</p>
                    <p className="text-xs text-zinc-500">{apt.email}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm font-medium text-zinc-900">{apt.amount}</p>
                    <p className="text-xs text-zinc-500">{apt.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}