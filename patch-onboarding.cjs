const fs = require('fs');
let code = fs.readFileSync('src/components/auth/OnboardingWizard.tsx', 'utf8');

const oldHandleFinalSubmit = `  const handleFinalSubmit = async () => {
    if (!name.trim()) {
      setError('Business name is required');
      setStep(1);
      return;
    }

    if (!phone.trim() && !whatsapp.trim()) {`;

const newHandleFinalSubmit = `  const handleFinalSubmit = async () => {
    if (!name.trim()) {
      setError('Business name is required');
      setStep(1);
      return;
    }
    
    const isCreator = type === 'creator';
    const currentSlug = isCreator ? (username.trim() || generateSlug(name)) : (slug.trim() || generateSlug(name));
    const RESERVED_SLUGS = ['login', 'dashboard', 'admin', 'settings', 'store', 'portfolio', 'api', 'auth', 'checkout', 'orders', 'profile', 'quote-pay'];
    if (RESERVED_SLUGS.includes(currentSlug.toLowerCase())) {
      setError('This username/slug is reserved and cannot be used. Please choose another one.');
      setStep(1);
      return;
    }

    if (!phone.trim() && !whatsapp.trim()) {`;

code = code.replace(oldHandleFinalSubmit, newHandleFinalSubmit);
fs.writeFileSync('src/components/auth/OnboardingWizard.tsx', code);
console.log('patched OnboardingWizard.tsx');
