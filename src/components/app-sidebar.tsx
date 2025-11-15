"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Tractor,
  Sprout,
  Droplets,
  Wheat,
  Users,
  CloudRain,
  Leaf,
  Activity,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Agricultural Officer",
    email: "officer@agri.gov",
    avatar: "/avatars/user.jpg",
  },
  navMain: [
    {
      title: "Farm Management",
      url: "#",
      icon: Tractor,
      isActive: false,
      items: [
        { title: "Land Preparation", url: "/land-preparation" },
        { title: "Seed Selection", url: "/seed-selection" },
        { title: "Irrigation Management", url: "/irrigation" },
        { title: "Weed Management", url: "/weed-management" },
        { title: "Nutrient Management", url: "/nutrient-management" },
        { title: "Pest Management", url: "/pest-management" },
        { title: "Harvest Management", url: "/harvest-management" },
      ],
    },
    {
      title: "Soil Moisture",
      url: "#",
      icon: Droplets,
      items: [
        { title: "Sensor Data", url: "/soil-moisture-sensor" },
        { title: "Manual Readings", url: "/soil-moisture-manual" },
      ],
    },
    {
      title: "Surveys",
      url: "#",
      icon: Activity,
      items: [
        { title: "Pest Survey", url: "/pest-survey" },
        { title: "Disease Survey", url: "/disease-survey" },
      ],
    },
  ],
  navSecondary: [
    { title: "Plant Nutrients", url: "/plant-nutrients", icon: Leaf },
    { title: "Crop Registrations", url: "/crop-registrations", icon: Wheat },
    { title: "Weather Stations", url: "/weather", icon: CloudRain },
    { title: "Farmers", url: "/farmers", icon: Users },
    { title: "Surveyors", url: "/surveyors", icon: Users },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props} className="border-r shadow-sm">
      <SidebarHeader className="border-b bg-gradient-primary">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/" className="flex items-center gap-3 hover:bg-white/10 transition-colors duration-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm shadow-lg">
                  <Sprout className="h-6 w-6" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-white text-lg">AgriAdvisory</span>
                  <span className="text-xs text-white/80">Farm Management</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/" className="flex items-center gap-3 hover:bg-primary/10 transition-all duration-200 rounded-lg">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <LayoutDashboard className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">Dashboard</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavMain items={data.navMain} />
        <SidebarMenu>
          {data.navSecondary.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url} className="flex items-center gap-3 hover:bg-accent/10 transition-all duration-200 rounded-lg">
                  <div className="p-1.5 rounded-lg bg-accent/10">
                    <item.icon className="h-4 w-4 text-accent" />
                  </div>
                  <span className="font-medium">{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t bg-muted/30">
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
