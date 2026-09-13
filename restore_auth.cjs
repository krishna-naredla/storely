const fs = require('fs');
const path = require('path');
const p = path.resolve('src/context/AuthContext.tsx');
let content = fs.readFileSync(p, 'utf8');
content = content.replace('const [currentUser, setCurrentUser] = useState<User | null>({uid: "123", email: "test@test.com"});', 'const [currentUser, setCurrentUser] = useState<User | null>(null);');
content = content.replace('const [loading, setLoading] = useState<boolean>(false);', 'const [loading, setLoading] = useState<boolean>(true);');
fs.writeFileSync(p, content);
