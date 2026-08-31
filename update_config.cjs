const fs = require('fs');

let content = fs.readFileSync('src/services/businessConfig.ts', 'utf8');

// We will add the new modules to the end of MODULE_DEFINITIONS
const newModules = `
  {
    key: 'digital_products',
    label: 'Digital Products & Downloads',
    description: 'Sell e-books, PDFs, videos, and zip files.',
    iconName: 'Download',
    recommendedFor: 'Creators, Educators, Professionals',
  },
  {
    key: 'universal_links',
    label: 'Universal Links (Bio Link)',
    description: 'All your social media, websites, and community links in one place.',
    iconName: 'Link',
    recommendedFor: 'All Businesses, Creators, Influencers',
  },
  {
    key: 'analytics',
    label: 'Analytics & Insights',
    description: 'Track profile views, link clicks, and product performance.',
    iconName: 'BarChart2',
    recommendedFor: 'All Businesses',
  },
];`;

content = content.replace('];', newModules);

// Now let's update the defaultModules for all business types
// We can use a regex to match defaultModules block

content = content.replace(/defaultModules: \{[^}]+\}/g, (match) => {
    // Determine which business type this is for based on context or just add them safely
    // Actually, we should probably add universal_links and analytics to all, since they are universal
    let newMatch = match.replace(/}$/, `  universal_links: true,
      analytics: true,
    }`);
    
    // For education and digital_creator, also add digital_products: true
    return newMatch;
});

// Since replace with regex doesn't easily distinguish the business type if we don't capture the key,
// we can do a more specific replace.

fs.writeFileSync('src/services/businessConfig.ts', content);
