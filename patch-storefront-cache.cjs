const fs = require('fs');
let code = fs.readFileSync('src/components/storefront/StorefrontView.tsx', 'utf8');

const oldCacheLogic = `  // Load all public store data from Firestore with Instant LocalStorage Caching
  const loadStoreData = async () => {
    const cacheKey = \`storelly_store_cache_\${business.id}\`;
    
    // 1. Instantly load from cache if available for 0ms load time
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setCatalogItems(parsed.items || []);
        setCategories(parsed.categories || []);
        setOffers(parsed.offers || []);
        setReviews(parsed.reviews || []);
        setEvents(parsed.events || []);
        setIsLoading(false);
      } catch (e) {
        // ignore parse errors
      }
    }

    try {
      if (!cachedData) {
        setIsLoading(true);
      }
      const [fetchedItems, fetchedCategories, fetchedOffers, fetchedReviews, fetchedEvents] = await Promise.all([
        getCatalogItems(business.id, true),
        getCategories(business.id),
        getOffers(business.id),
        getReviews(business.id, true),
        getEvents(business.id, true)
      ]);

      setCatalogItems(fetchedItems);
      setCategories(fetchedCategories);
      setOffers(fetchedOffers);
      setReviews(fetchedReviews);
      setEvents(fetchedEvents);

      // Save fresh data to cache
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          items: fetchedItems,
          categories: fetchedCategories,
          offers: fetchedOffers,
          reviews: fetchedReviews,
          events: fetchedEvents
        })
      );
    } catch (err) {
      console.error('Failed to load store data:', err);
    } finally {
      setIsLoading(false);
    }
  };`;

const newCacheLogic = `  const loadStoreData = async () => {
    try {
      setIsLoading(true);
      const [fetchedItems, fetchedCategories, fetchedOffers, fetchedReviews, fetchedEvents] = await Promise.all([
        getCatalogItems(business.id, true),
        getCategories(business.id),
        getOffers(business.id),
        getReviews(business.id, true),
        getEvents(business.id, true)
      ]);

      setCatalogItems(fetchedItems);
      setCategories(fetchedCategories);
      setOffers(fetchedOffers);
      setReviews(fetchedReviews);
      setEvents(fetchedEvents);
    } catch (err) {
      console.error('Failed to load store data:', err);
    } finally {
      setIsLoading(false);
    }
  };`;

code = code.replace(oldCacheLogic, newCacheLogic);
fs.writeFileSync('src/components/storefront/StorefrontView.tsx', code);
console.log('patched cache logic');
