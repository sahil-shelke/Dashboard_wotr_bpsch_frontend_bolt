"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
 navMain: [
  {
    title: "Farm Management",
    url: "#",
    icon: SquareTerminal,
    isActive: true,
    items: [
      { title: "Land Preparations", url: "#" },
      { title: "Seed Selections", url: "#" },
      { title: "Irrigation Management", url: "#" },
      { title: "Weed Management", url: "#" },
      { title: "Nutrient Management", url: "#" },
      { title: "Pest Management", url: "#" },
      { title: "Harvest Management", url: "#" },
    ],
  },
  {
    title: "Soil Moisture",
    url: "#",
    icon: Bot,
    items: [
      { title: "Sensors", url: "#" },
      { title: "Manual Readings", url: "#" },
    ],
  },



  {
    title: "Surveys",
    url: "#",
    icon: Settings2,
    items: [
      { title: "Pest Survey", url: "#" },
      { title: "Disease Survey", url: "#" },
    ],
  },
],

}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
          
     
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
