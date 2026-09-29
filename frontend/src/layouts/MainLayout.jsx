import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  Globe,
  List,
  Calendar,
  BookOpen,
  Upload,
  Users,
  Settings,
  Palette,
  Headphones,
  Moon,
  Sun,
  Search,
  ChevronUp,
  LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  SidebarHeader
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const tradingItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Add Trade", path: "/add-trade", icon: PlusCircle },
  { name: "Past Trades", path: "/trades", icon: List },
  { name: "Calendar", path: "/calendar", icon: Calendar },
];

const analysisItems = [
  { name: "Journal History", path: "/history", icon: BookOpen },
  { name: "Economic Calendar", path: "/news", icon: Globe },
  { name: "Accounts", path: "/accounts", icon: Users },
  { name: "Import Trades", path: "/import", icon: Upload },
];

const appItems = [
  { name: "Settings", path: "/settings", icon: Settings },
  { name: "Customize", path: "/customize", icon: Palette },
  { name: "Support", path: "/support", icon: Headphones },
];

export default function MainLayout() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar className="border-r border-border">
          <SidebarHeader className="p-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center font-bold text-primary-foreground shadow-md">
                💲🧠
              </div>
              <h1 className="text-base font-bold tracking-tight text-primary">
                Forex Notes
              </h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="rounded-full w-8 h-8"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">Trading</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {tradingItems.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={location.pathname.includes(item.path)} className="rounded-full">
                        <NavLink to={item.path} className="flex items-center gap-3 py-5">
                          <item.icon className="h-5 w-5" />
                          <span className="font-medium text-sm">{item.name}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">Analysis</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {analysisItems.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={location.pathname.includes(item.path)} className="rounded-full">
                        <NavLink to={item.path} className="flex items-center gap-3 py-5">
                          <item.icon className="h-5 w-5" />
                          <span className="font-medium text-sm">{item.name}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">App</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {appItems.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={location.pathname.includes(item.path)} className="rounded-full">
                        <NavLink to={item.path} className="flex items-center gap-3 py-5">
                          <item.icon className="h-5 w-5" />
                          <span className="font-medium text-sm">{item.name}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-full p-2 h-14"
                    >
                      <Avatar className="h-10 w-10 rounded-full">
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                          MP
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight ml-2">
                        <span className="truncate font-semibold text-sm">Mayur Patil</span>
                        <span className="truncate text-xs text-muted-foreground">Pro Plan</span>
                      </div>
                      <ChevronUp className="ml-auto size-4 text-muted-foreground" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="top"
                    className="w-[--radix-popper-anchor-width] rounded-2xl"
                  >
                    <DropdownMenuItem className="rounded-xl">
                      <Settings className="mr-2 h-4 w-4" />
                      Account Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive rounded-xl">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col overflow-hidden w-full">
          {/* Top Header */}
          <header className="flex h-16 items-center gap-4 border-b border-border bg-background px-4 lg:px-6 shrink-0 transition-colors">
            <SidebarTrigger className="text-foreground -ml-2 hover:bg-muted p-2 rounded-full w-10 h-10" />
            
            <div className="hidden md:flex items-center relative w-72">
              <Search className="absolute left-3 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search trades, accounts..." className="pl-9 bg-muted/50 border-border/50 rounded-full h-10 focus-visible:ring-primary/20" />
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                className="hidden sm:flex rounded-full gap-2 border-border/50 text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/add-trade")}
              >
                <PlusCircle className="w-4 h-4 text-primary" /> Quick Add
              </Button>
              <Button
                className="rounded-full gap-2 shadow-sm"
                onClick={() => navigate("/add-trade")}
              >
                <PlusCircle className="w-4 h-4" /> Add Trade
              </Button>
              
              {/* Mobile theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="rounded-full md:hidden w-10 h-10"
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-8">
            <div className="max-w-7xl mx-auto w-full">
               <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
