import {
  LayoutDashboard, Megaphone, Ticket, BarChart3, QrCode, ShieldCheck,
  Heart, Users, Gift, History, Settings2,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
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

const crmItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Campaigns", url: "/admin/campaigns", icon: Megaphone },
  { title: "Coupons", url: "/admin/coupons", icon: Ticket },
  { title: "Redeem", url: "/admin/redeem", icon: ShieldCheck },
  { title: "Generate QR", url: "/admin/generate", icon: QrCode },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
];

const loyaltyItems = [
  { title: "Loyalty Dashboard", url: "/admin/loyalty", icon: Heart },
  { title: "Members", url: "/admin/loyalty/members", icon: Users },
  { title: "Rewards", url: "/admin/loyalty/rewards", icon: Gift },
  { title: "Redeem Reward", url: "/admin/loyalty/redeem", icon: ShieldCheck },
  { title: "Transactions", url: "/admin/loyalty/transactions", icon: History },
  { title: "Point Rules", url: "/admin/loyalty/rules", icon: Settings2 },
];


export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && <Link to="/"><img alt="Cafe Connect" className="h-16 object-contain cursor-pointer" src="/lovable-uploads/afe08f13-99df-4712-b30b-39694af91039.png" /></Link>}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Promotions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {crmItems.map((item) =>
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
        <SidebarGroup>
          <SidebarGroupLabel>Loyalty Program</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loyaltyItems.map((item) =>
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