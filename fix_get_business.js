import fs from 'fs';

let service = fs.readFileSync('src/services/firebaseService.ts', 'utf8');

service = service.replace(/const data = snap\.data\(\) as BusinessProfile;\s+saveLocalBusiness\(data\);\s+return data;/g, `const data = snap.data() as BusinessProfile;
      if (data.status === 'deleted') {
        removeLocalBusiness(data.id);
        return null;
      }
      saveLocalBusiness(data);
      return data;`);

service = service.replace(/if \(matched\) \{\s+const data = matched\.data\(\) as BusinessProfile;\s+saveLocalBusiness\(data\);\s+return data;\s+\}/g, `if (matched) {
      const data = matched.data() as BusinessProfile;
      if (data.status === 'deleted') {
        removeLocalBusiness(data.id);
        return null;
      }
      saveLocalBusiness(data);
      return data;
    }`);

fs.writeFileSync('src/services/firebaseService.ts', service);
console.log("Fixed getBusinessBySlug step 3 and 4");
