

import * as React from "react"
import { useState, useEffect } from "react"
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

import wotr from "../assets/wotrlogo.svg"

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

const navData = {
  navMain: [
    {
      title: "Crop Monitoring",
      url: "#",
      icon: Sprout,
      isActive: false,
      items: [
        {
          title: "Farm Management",
          url: "#",
          items: [
            { title: "Land Preparation", url: "/land-preparation" },
            { title: "Seed Selection", url: "/seed-selection" },
            { title: "Irrigation Management", url: "/irrigation" },
            { title: "Nutrient Management", url: "/nutrient-management" },
            { title: "Pest Management", url: "/pest-management" },
            { title: "Harvest Management", url: "/harvest-management" },
          ],
        },
        {
          title: "Surveys",
          url: "#",
          items: [
            { title: "Pest Survey", url: "/pest-survey" },
            { title: "Disease Survey", url: "/disease-survey" },
          ],
        },
      ],
    },
    {
      title: "Ground Truth Data",
      url: "#",
      icon: Droplets,
      items: [
        { title: "Chlorophyll Readings", url: "/plant-nutrients" },
        { title: "Soil Readings", url: "/soil-moisture-manual" },
      ],
    },
    {
      title: "Sensor Network",
      url: "#",
      icon: Activity,
      items: [
        { title: "Weather Data", url: "/weather" },
        { title: "Soil IOT Data", url: "/soil-moisture-sensor" },
      ],
    },
  ],
  navSecondary: [],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    const email = localStorage.getItem("sessionEmail") || "officer@agri.gov"
    setUserEmail(email)
  }, [])

  const isSpecialUser = userEmail === 'aniket.shelke@wotr.org.in'

  const conditionalMenuItems = isSpecialUser ? [
    { title: "Farmers", url: "/farmers", icon: Users },
    { title: "Crop Registration", url: "/crop-registrations", icon: Wheat },
  ] : []

  const getInitials = (email: string) => {
    const name = email.split("@")[0]
    return name.substring(0, 2).toUpperCase()
  }

  const userData = {
    name: userEmail.split("@")[0] || "Agricultural Officer",
    email: userEmail,
    avatar: "/avatars/user.jpg",
  }

  return (
    <Sidebar collapsible="icon" {...props} className="border-r border-[#6D4C41]/10" >
      <SidebarHeader className="border-b border-[#6D4C41]/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/" className="flex items-center gap-3">
                <img
                  src={wotr}
                  alt="Logo"
                  className="h-10 w-10 object-contain rounded-lg"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-[#2E3A3F]/70 whitespace-normal leading-tight">Farm Management System</span>
                  {/* <span className="font-semibold text-[#2E3A3F] whitespace-normal leading-tight">WOTR SURVEYOR</span> */}
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
                <span className="whitespace-normal leading-tight">Summary</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavMain items={navData.navMain} />
        <SidebarMenu>
          {navData.navSecondary.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url} className="flex items-center gap-3 hover:bg-[#7CB342]/10 text-xs">
                  <item.icon className="h-5 w-5" />
                  <span className="whitespace-normal leading-tight text-xs">{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {conditionalMenuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url} className="flex items-center gap-3 hover:bg-[#7CB342]/10 text-xs">
                  <item.icon className="h-5 w-5" />
                  <span className="whitespace-normal leading-tight text-xs">{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-[#6D4C41]/10">
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
