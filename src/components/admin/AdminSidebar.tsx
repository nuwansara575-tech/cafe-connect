import {
  LayoutDashboard, Megaphone, Ticket, BarChart3, QrCode, ShieldCheck } from
"lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar } from
"@/components/ui/sidebar";
import logoOrange from "@/assets/logo-orange.png";

const items = [
{ title: "Dashboard", url: "/admin", icon: LayoutDashboard },
{ title: "Campaigns", url: "/admin/campaigns", icon: Megaphone },
{ title: "Coupons", url: "/admin/coupons", icon: Ticket },
{ title: "Redeem", url: "/admin/redeem", icon: ShieldCheck },
{ title: "Generate QR", url: "/admin/generate", icon: QrCode },
{ title: "Analytics", url: "/admin/analytics", icon: BarChart3 }];


export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && <img alt="Cafe Connect" className="h-16 object-contain" src="/lovable-uploads/afe08f13-99df-4712-b30b-39694af91039.png" />}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) =>
              <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>);

}