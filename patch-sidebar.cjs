const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/Sidebar.tsx', 'utf8');

const oldNav = `  const navItems: {
    id: DashboardTab;
    label: string;
    icon: React.ElementType;
    badge?: string;
    visible: boolean;
  }[] = [
    {
      id: "overview",
      label: t("sidebar.dashboard"),
      icon: LayoutDashboard,
      visible: true,
    },
    {
      id: "catalog",
      label: bizMeta.itemPlural || t("sidebar.catalog"),
      icon: Package,
      visible:
        !!modules?.products ||
        !!modules?.services ||
        !!modules?.menu ||
        !!modules?.rooms ||
        !!modules?.vehicles ||
        !!modules?.digital_products,
    },`;

const newNav = `  const isCreator = business?.type === 'creator';
  
  const navItems: {
    id: DashboardTab;
    label: string;
    icon: React.ElementType;
    badge?: string;
    visible: boolean;
  }[] = isCreator ? [
    { id: "overview", label: "Overview", icon: LayoutDashboard, visible: true },
    { id: "modules", label: "My Modules", icon: Layers, visible: true },
    { id: "catalog", label: "Digital Store", icon: ShoppingBag, visible: !!modules?.digital_products || !!modules?.digitalProducts },
    { id: "orders", label: "Downloads & Orders", icon: Package, visible: !!modules?.digital_products || !!modules?.digitalProducts },
    { id: "biolink", label: "Universal Bio Link", icon: Link, visible: !!modules?.universal_links },
    { id: "portfolio", label: "Portfolio", icon: Briefcase, visible: !!modules?.work_portfolio || !!modules?.portfolio },
    { id: "events", label: "Events & Ticketing", icon: Ticket, visible: !!modules?.events_ticketing },
    { id: "quotes", label: "Custom Quotes", icon: FileText, visible: !!modules?.custom_quotes },
    { id: "reviews", label: "Reviews", icon: Star, visible: true },
    { id: "analytics", label: "Analytics", icon: BarChart3, visible: true },
    { id: "settings", label: "Settings", icon: Settings, visible: true },
  ] : [
    {
      id: "overview",
      label: t("sidebar.dashboard"),
      icon: LayoutDashboard,
      visible: true,
    },
    {
      id: "catalog",
      label: bizMeta.itemPlural || t("sidebar.catalog"),
      icon: Package,
      visible:
        !!modules?.products ||
        !!modules?.services ||
        !!modules?.menu ||
        !!modules?.rooms ||
        !!modules?.vehicles ||
        !!modules?.digital_products,
    },`;

code = code.replace(oldNav, newNav);

fs.writeFileSync('src/components/dashboard/Sidebar.tsx', code);
console.log('patched Sidebar');
