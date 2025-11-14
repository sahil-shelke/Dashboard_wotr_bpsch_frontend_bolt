import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  return (
    <SidebarGroup>
      
      <SidebarMenu>
                 <SidebarMenuButton asChild>
          <a href="#">
            <span>Surveyors</span>
          </a>
        </SidebarMenuButton>
                 <SidebarMenuButton asChild>
          <a href="#">
            <span>Farmers</span>
          </a>
        </SidebarMenuButton>
                       <SidebarMenuButton asChild>
          <a href="#">
            <span>Crop Registrations</span>
          </a>
        </SidebarMenuButton>

        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <a href={subItem.url}>
                          <span>{subItem.title}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
         <SidebarMenuButton asChild>
          <a href="#">
            <span>Plant Nutrients</span>
          </a>
        </SidebarMenuButton>
                 <SidebarMenuButton asChild>
          <a href="#">
            <span>Davis Weather</span>
          </a>
        </SidebarMenuButton>
      </SidebarMenu>
    </SidebarGroup>
  )
}
