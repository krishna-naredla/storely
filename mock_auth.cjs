const fs = require('fs');
const path = require('path');
const p = path.resolve('src/context/AuthContext.tsx');
let content = fs.readFileSync(p, 'utf8');
content = content.replace('const [currentUser, setCurrentUser] = useState<User | null>(null);', 'const [currentUser, setCurrentUser] = useState<User | null>({uid: "123", email: "test@test.com"});');
content = content.replace('const [loading, setLoading] = useState<boolean>(true);', 'const [loading, setLoading] = useState<boolean>(false);');
fs.writeFileSync(p, content);
