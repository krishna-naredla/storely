export interface CategoryColorOption {
  id: string;
  name: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  hex: string;
}

export const CATEGORY_COLOR_PALETTE: CategoryColorOption[] = [
  { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500', hex: '#6366f1' },
  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', hex: '#10b981' },
  { id: 'amber', name: 'Amber', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500', hex: '#f59e0b' },
  { id: 'rose', name: 'Rose', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', hex: '#f43f5e' },
  { id: 'violet', name: 'Violet', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500', hex: '#8b5cf6' },
  { id: 'sky', name: 'Sky', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500', hex: '#0ea5e9' },
  { id: 'orange', name: 'Orange', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', hex: '#f97316' },
  { id: 'fuchsia', name: 'Fuchsia', bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', dot: 'bg-fuchsia-500', hex: '#d946ef' },
  { id: 'slate', name: 'Slate', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-500', hex: '#64748b' },
];

export function getCategoryColorConfig(colorId?: string): CategoryColorOption {
  if (!colorId) return CATEGORY_COLOR_PALETTE[0];
  const found = CATEGORY_COLOR_PALETTE.find(c => c.id === colorId);
  return found || CATEGORY_COLOR_PALETTE[0];
}
