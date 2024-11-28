"use client"

import * as React from "react"
import {
  ArrowUpDown,
  BookOpen,
  Bot,
  ChevronRight,
  SquareTerminal,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@radix-ui/react-collapsible"
import { useEditorState } from "@/stores/editor-store"
import { TransformationNodeIcons } from "./transformation-node"
import { SiGooglecloudstorage } from "react-icons/si"
import { StageType } from "../../../shared/types/stages"
import { TransformationType } from "../../../shared/types/transformations"
import { SourceType } from "../../../shared/types/sources"
import { PiDatabaseFill } from "react-icons/pi"
import { DestinationType } from "../../../shared/types/destinations"

enum SidebarItems {
  Sources = "Sources",
  Destinations = "Destinations",
  Transformations = "Transformations"
}

const sidebarItems = [
  {
    title: SidebarItems.Sources,
    icon: SquareTerminal,
    isActive: true,
    items: [
      {
        title: "Demo Data",
        icon: PiDatabaseFill,
        subType: SourceType.Demo
      },
      {
        title: "Google Cloud Storage",
        icon: SiGooglecloudstorage,
        subType: SourceType.GoogleCloudStorage
      },
    ],
  },
  {
    title: SidebarItems.Destinations,
    icon: Bot,
    items: [
      {
        title: "Google Cloud Storage",
        icon: SiGooglecloudstorage,
        subType: DestinationType.GoogleCloudStorage
      },
    ],
  },
  {
    title: SidebarItems.Transformations,
    icon: BookOpen,
    items: [
      {
        title: "Filter",
        icon: TransformationNodeIcons.filter,
        subType: TransformationType.Filter
      },
      {
        title: "Map",
        icon: TransformationNodeIcons.map,
        subType: TransformationType.Map
      },
      {
        title: "Join",
        icon: TransformationNodeIcons.join,
        subType: TransformationType.Join
      },
      {
        title: "Aggregate",
        icon: TransformationNodeIcons.aggregate,
        subType: TransformationType.Aggregate
      },
      {
        title: "Select",
        icon: TransformationNodeIcons.select,
        subType: TransformationType.Select
      },
      {
        title: "Sort",
        icon: TransformationNodeIcons.sort,
        subType: TransformationType.Sort
      }
    ],
  },
]

const EditorSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const { onSelectNode } = useEditorState()
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <ArrowUpDown className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">ETL App</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
      
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {sidebarItems.map((item) => (
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
                          <SidebarMenuSubButton className="cursor-pointer" onClick={
                            () => {
                              if (item.title == SidebarItems.Sources)
                                return onSelectNode(StageType.Source, subItem.subType)
                              else if (item.title == SidebarItems.Destinations)
                                return onSelectNode(StageType.Destination, subItem.subType)
                              else if (item.title == SidebarItems.Transformations)
                                return onSelectNode(StageType.Transformation, subItem.subType)
                            }
                          }>
                            {subItem.icon && <subItem.icon />}
                            <span>{subItem.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

export default EditorSidebar
