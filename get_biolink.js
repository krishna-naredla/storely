import fs from 'fs';
let content = fs.readFileSync('src/components/storefront/StorefrontView.tsx', 'utf8');

content = content.replace(/getEvents,/g, "getEvents, getBioLinks, recordBioLinkClick,");

// Add state for bio links
content = content.replace(/const \[events, setEvents\] = useState<EventItem\[\]>\(\[\]\);/g, "const [events, setEvents] = useState<EventItem[]>([]);\n  const [bioLinks, setBioLinks] = useState<any[]>([]);");

// Add fetch
content = content.replace(/getEvents\(business\.id\),/g, "getEvents(business.id),\n        getBioLinks(business.id),");

// Add to Promise destructure
content = content.replace(/fetchedReviews, fetchedEvents\] = await Promise.all\(/g, "fetchedReviews, fetchedEvents, fetchedBioLinks] = await Promise.all(");

// Add to state setter
content = content.replace(/setEvents\(activeEvents\);/g, "setEvents(activeEvents);\n      setBioLinks(fetchedBioLinks.filter(l => l.enabled).sort((a,b) => (a.order || 0) - (b.order || 0)));");

// Add to cache saving
content = content.replace(/events: activeEvents,/g, "events: activeEvents,\n          bioLinks: fetchedBioLinks.filter(l => l.enabled).sort((a,b) => (a.order || 0) - (b.order || 0)),");

// Add to cache loading
content = content.replace(/setEvents\(parsed\.events \|\| \[\]\);/g, "setEvents(parsed.events || []);\n        setBioLinks(parsed.bioLinks || []);");

fs.writeFileSync('src/components/storefront/StorefrontView.tsx', content);
console.log("Added BioLinks fetch to StorefrontView");
