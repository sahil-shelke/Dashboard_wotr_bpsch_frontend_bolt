import { ChevronRight, type LucideIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
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
      items?: {
        title: string
        url: string
      }[]
    }[]
  }[]
}) {
  const navigate = useNavigate()
  const { isMobile, setOpenMobile } = useSidebar()

  const handleSubItemClick = (url: string) => {
    navigate(url)
    // Only close sidebar on mobile
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel className="text-[#6D4C41] font-semibold">Operations</SidebarGroupLabel> */}
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={true}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title} className="hover:bg-[#7CB342]/10">
                  {item.icon && <item.icon className="text-[#1B5E20]" />}
                  <span className="text-[#2E3A3F]">{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-[#6D4C41]" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    subItem.items ? (
                      <Collapsible
                        key={subItem.title}
                        asChild
                        className="group/nested-collapsible"
                        defaultOpen={true}
                      >
                        <SidebarMenuSubItem className="ml-[-12px]">
                          <CollapsibleTrigger asChild>
                            <SidebarMenuSubButton className="hover:bg-[#7CB342]/10">
                              <span className="text-[#2E3A3F]/80">{subItem.title}</span>
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/nested-collapsible:rotate-90 text-[#6D4C41] text-9xl" />
                            </SidebarMenuSubButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {subItem.items.map((nestedItem) => (
                                <SidebarMenuSubItem key={nestedItem.title} className="ml-[-12px]">
                                  <SidebarMenuSubButton asChild className="hover:bg-[#7CB342]/10">
                                    <button
                                      onClick={() => handleSubItemClick(nestedItem.url)}
                                      className="text-[#2E3A3F]/70 hover:text-[#1B5E20] text-left w-full"
                                    >
                                      <span className="text-[13px]">{nestedItem.title}</span>
                                    </button>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuSubItem>
                      </Collapsible>
                    ) : (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild className="hover:bg-[#7CB342]/10">
                          <button
                            onClick={() => handleSubItemClick(subItem.url)}
                            className="text-[#2E3A3F]/80 hover:text-[#1B5E20] text-left w-full"
                          >
                            <span className="text-[13px]">{subItem.title}</span>
                          </button>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
