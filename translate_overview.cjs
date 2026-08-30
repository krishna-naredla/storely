const fs = require('fs');
let content = fs.readFileSync('src/components/dashboard/DashboardOverview.tsx', 'utf8');

content = content.replace(/>Overview</g, '>{t("dashboard.overview")}<');
content = content.replace(/>Total Revenue</g, '>{t("dashboard.totalRevenue")}<');
content = content.replace(/>Revenue</g, '>{t("dashboard.totalRevenue")}<');
content = content.replace(/>Total Orders</g, '>{t("dashboard.totalOrders")}<');
content = content.replace(/>Active Storefronts</g, '>{t("dashboard.activeStorefronts")}<');
content = content.replace(/>Recent Orders</g, '>{t("dashboard.recentOrders")}<');
content = content.replace(/>View All</g, '>{t("dashboard.viewAll")}<');

fs.writeFileSync('src/components/dashboard/DashboardOverview.tsx', content);
