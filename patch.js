const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCode = `      // Otherwise redirect to secure Cloudinary file URL
      return res.redirect(fileUrl);`;

const newCode = `      // Proxy the file to ensure correct headers and prevent JSON/HTML errors
      if (fileUrl.startsWith("http")) {
        try {
          const fetchRes = await fetch(fileUrl);
          if (!fetchRes.ok) {
            throw new Error(\`Storage returned \${fetchRes.status}\`);
          }
          
          // Force PDF content type if not provided or if it's generic binary
          let contentType = fetchRes.headers.get("content-type") || "application/pdf";
          if (contentType.includes("text/plain") || contentType.includes("application/octet-stream")) {
            if (fileUrl.toLowerCase().includes(".pdf") || (check.payload?.fileName || "").toLowerCase().endsWith(".pdf")) {
              contentType = "application/pdf";
            }
          }
          
          res.setHeader("Content-Type", contentType);
          res.setHeader("Content-Disposition", \`attachment; filename="\${check.payload?.fileName || "download.pdf"}"\`);
          
          const arrayBuffer = await fetchRes.arrayBuffer();
          return res.send(Buffer.from(arrayBuffer));
        } catch (fetchErr) {
          console.error("Proxy download error:", fetchErr);
          // Fallback to redirect if proxy fails
          return res.redirect(fileUrl);
        }
      }
      return res.redirect(fileUrl);`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('server.ts', code);
  console.log("Patched server.ts successfully");
} else {
  console.log("Could not find code to replace");
}
