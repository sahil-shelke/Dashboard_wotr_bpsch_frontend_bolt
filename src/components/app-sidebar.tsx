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
    <Sidebar collapsible="icon" {...props} className="border-r border-[#6D4C41]/10">
      <SidebarHeader className="border-b border-[#6D4C41]/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1B5E20] text-white">
                  <Sprout className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-[#2E3A3F]">WOTR SURVEYOR</span>
                  <span className="text-xs text-[#2E3A3F]/70">Farm Management System</span>
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
              <a href="/" className="flex items-center gap-3 hover:bg-[#7CB342]/10">
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavMain items={data.navMain} />
        <SidebarMenu>
          {data.navSecondary.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url} className="flex items-center gap-3 hover:bg-[#7CB342]/10">
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-[#6D4C41]/10">
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
