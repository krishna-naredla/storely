import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Sparkles,
  Briefcase,
  User,
  Star,
  ShoppingBag,
  Send,
  MessageSquare,
  Award,
  Link,
  RotateCcw,
  Check,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { PortfolioBlock, PortfolioBlockType, BusinessProfile } from '../../types';
import { ConfirmActionModal } from '../common/ConfirmActionModal';
import { getDefaultPortfolioBlocks } from '../../utils/portfolioTheme';
import { updateBusinessProfile } from '../../services/firebaseService';

interface PortfolioBlocksManagerProps {
  blocks: PortfolioBlock[];
  onChange?: (updatedBlocks: PortfolioBlock[]) => void;
  onChangeBlocks?: (updatedBlocks: PortfolioBlock[]) => void;
  business: BusinessProfile;
  onBusinessUpdated?: (updated: BusinessProfile) => void;
}

const BLOCK_TYPE_META: Record<
  PortfolioBlockType,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  hero: { label: 'Hero Banner & Avatar', icon: User, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  works: { label: 'Works Showcase & Projects', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
  about: { label: 'About Story & Bio', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
  skills: { label: 'Skills & Tech Stack', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50' },
  services: { label: 'Services & Pricing', icon: ShoppingBag, color: 'text-teal-600', bg: 'bg-teal-50' },
  testimonials: { label: 'Client Reviews & Ratings', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
  mediakit: { label: 'Media Kit & Stats', icon: Award, color: 'text-pink-600', bg: 'bg-pink-50' },
  contact: { label: 'Contact & Inquiry Form', icon: Send, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  custom: { label: 'Custom Section Card', icon: Layers, color: 'text-violet-600', bg: 'bg-violet-50' },
  custom_cta: { label: 'Custom Call-To-Action Card', icon: Link, color: 'text-violet-600', bg: 'bg-violet-50' },
  custom_rich_text: { label: 'Custom Text / Announcement', icon: MessageSquare, color: 'text-sky-600', bg: 'bg-sky-50' },
  custom_rich: { label: 'Rich Story / Showcase Block', icon: MessageSquare, color: 'text-sky-600', bg: 'bg-sky-50' },
};

export const PortfolioBlocksManager: React.FC<PortfolioBlocksManagerProps> = ({
  blocks,
  onChange,
  onChangeBlocks,
  business,
  onBusinessUpdated,
}) => {
  const [editingBlock, setEditingBlock] = useState<PortfolioBlock | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<PortfolioBlock | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // New Block Form State
  const [newBlockType, setNewBlockType] = useState<PortfolioBlockType>('custom_cta');
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockSubtitle, setNewBlockSubtitle] = useState('');
  const [newBlockContent, setNewBlockContent] = useState('');
  const [newBlockButtonText, setNewBlockButtonText] = useState('');
  const [newBlockButtonUrl, setNewBlockButtonUrl] = useState('');

  // Central update dispatcher: notifies parent and immediately persists to Firestore
  const applyBlocksUpdate = (updatedBlocks: PortfolioBlock[]) => {
    if (onChangeBlocks) onChangeBlocks(updatedBlocks);
    if (onChange) onChange(updatedBlocks);

    if (business?.id) {
      const updatedSettings = {
        ...business.portfolioSettings,
        blocks: updatedBlocks,
      };
      updateBusinessProfile(business.id, {
        portfolioSettings: updatedSettings,
      }).catch((err) => {
        console.warn('Auto-syncing portfolio blocks to Firestore warning:', err);
      });

      if (onBusinessUpdated) {
        onBusinessUpdated({
          ...business,
          portfolioSettings: updatedSettings,
        });
      }
    }
  };

  // Move Block Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...blocks];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    // Re-assign orders
    const normalized = next.map((b, i) => ({ ...b, order: i + 1 }));
    applyBlocksUpdate(normalized);
  };

  // Move Block Down
  const handleMoveDown = (index: number) => {
    if (index === blocks.length - 1) return;
    const next = [...blocks];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    // Re-assign orders
    const normalized = next.map((b, i) => ({ ...b, order: i + 1 }));
    applyBlocksUpdate(normalized);
  };

  // Toggle Visibility
  const handleToggleVisibility = (blockId: string) => {
    const updated = blocks.map((b) => (b.id === blockId ? { ...b, enabled: !b.enabled } : b));
    applyBlocksUpdate(updated);
  };

  // Delete Block Confirmation
  const confirmDeleteBlock = () => {
    if (!blockToDelete) return;
    const filtered = blocks.filter((b) => b.id !== blockToDelete.id);
    const normalized = filtered.map((b, i) => ({ ...b, order: i + 1 }));
    applyBlocksUpdate(normalized);
    setBlockToDelete(null);
  };

  // Reset to Default Order
  const handleResetToDefault = () => {
    const defaults = getDefaultPortfolioBlocks(business);
    applyBlocksUpdate(defaults);
    setIsResetConfirmOpen(false);
  };

  // Save Edit
  const handleSaveEditBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlock) return;
    const updated = blocks.map((b) => (b.id === editingBlock.id ? editingBlock : b));
    applyBlocksUpdate(updated);
    setEditingBlock(null);
  };

  // Add Block
  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    const meta = BLOCK_TYPE_META[newBlockType];
    const newBlock: PortfolioBlock = {
      id: `block_${Date.now()}`,
      type: newBlockType,
      title: newBlockTitle.trim() || meta.label,
      subtitle: newBlockSubtitle.trim(),
      content: newBlockContent.trim(),
      customContent: {
        bodyText: newBlockContent.trim(),
        buttonText: newBlockButtonText.trim(),
        buttonUrl: newBlockButtonUrl.trim(),
      },
      enabled: true,
      order: blocks.length + 1,
    };
    applyBlocksUpdate([...blocks, newBlock]);
    setIsAddModalOpen(false);
    // Reset inputs
    setNewBlockTitle('');
    setNewBlockSubtitle('');
    setNewBlockContent('');
    setNewBlockButtonText('');
    setNewBlockButtonUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-black font-heading text-slate-900 dark:text-white">
              Portfolio Content Blocks &amp; Section Layout
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, edit, reorder (↑/↓), or toggle individual sections on your live public portfolio website.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Layout</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Block</span>
          </button>
        </div>
      </div>

      {/* Blocks List */}
      <div className="space-y-3">
        {blocks.map((block, index) => {
          const meta = BLOCK_TYPE_META[block.type] || {
            label: 'Section Block',
            icon: Layers,
            color: 'text-slate-600',
            bg: 'bg-slate-100',
          };
          const Icon = meta.icon;

          return (
            <div
              key={block.id}
              className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs ${
                block.enabled
                  ? 'border-slate-200/80 dark:border-slate-800'
                  : 'border-slate-200/50 dark:border-slate-800/50 opacity-60 bg-slate-50/50'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="flex flex-col items-center justify-center font-mono font-black text-xs text-slate-400 dark:text-slate-500 w-6">
                  #{index + 1}
                </div>

                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.color} dark:bg-slate-800`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">
                      {block.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {meta.label}
                    </span>
                    {!block.enabled && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        Hidden
                      </span>
                    )}
                  </div>
                  {block.subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {block.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Action Controls */}
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                {/* Reorder Up / Down */}
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  title="Move section up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === blocks.length - 1}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  title="Move section down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

                {/* Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleVisibility(block.id)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    block.enabled
                      ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={block.enabled ? 'Hide from live portfolio' : 'Show on live portfolio'}
                >
                  {block.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => setEditingBlock(block)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                  title="Edit block details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => setBlockToDelete(block)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  title="Remove block"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Block Modal */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black font-heading text-slate-900 dark:text-white mb-4">
              Edit Content Block
            </h3>

            <form onSubmit={handleSaveEditBlock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Block Title
                </label>
                <input
                  type="text"
                  required
                  value={editingBlock.title}
                  onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subtitle / Description
                </label>
                <input
                  type="text"
                  value={editingBlock.subtitle || ''}
                  onChange={(e) => setEditingBlock({ ...editingBlock, subtitle: e.target.value })}
                  placeholder="Optional section tagline"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {(editingBlock.type === 'custom_cta' || editingBlock.type === 'custom_rich_text') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Custom Content / Narrative
                  </label>
                  <textarea
                    rows={4}
                    value={editingBlock.content || ''}
                    onChange={(e) => setEditingBlock({ ...editingBlock, content: e.target.value })}
                    placeholder="Describe your special announcement or custom service highlights..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {editingBlock.type === 'custom_cta' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={editingBlock.buttonText || ''}
                      onChange={(e) =>
                        setEditingBlock({ ...editingBlock, buttonText: e.target.value })
                      }
                      placeholder="e.g. Schedule Call"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Button URL / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={editingBlock.buttonUrl || ''}
                      onChange={(e) =>
                        setEditingBlock({ ...editingBlock, buttonUrl: e.target.value })
                      }
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBlock(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer"
                >
                  Apply Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Block Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black font-heading text-slate-900 dark:text-white mb-2">
              Add New Portfolio Content Block
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Select the module type and customize its content for your live portfolio.
            </p>

            <form onSubmit={handleCreateBlock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Block Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(BLOCK_TYPE_META) as PortfolioBlockType[]).map((typeKey) => {
                    const meta = BLOCK_TYPE_META[typeKey];
                    const Icon = meta.icon;
                    const isSelected = newBlockType === typeKey;

                    return (
                      <button
                        type="button"
                        key={typeKey}
                        onClick={() => setNewBlockType(typeKey)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${meta.bg} ${meta.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs truncate">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Block Title
                </label>
                <input
                  type="text"
                  required
                  value={newBlockTitle}
                  onChange={(e) => setNewBlockTitle(e.target.value)}
                  placeholder={BLOCK_TYPE_META[newBlockType].label}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={newBlockSubtitle}
                  onChange={(e) => setNewBlockSubtitle(e.target.value)}
                  placeholder="Section tagline or context"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {(newBlockType === 'custom_cta' || newBlockType === 'custom_rich_text') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Custom Content
                  </label>
                  <textarea
                    rows={3}
                    value={newBlockContent}
                    onChange={(e) => setNewBlockContent(e.target.value)}
                    placeholder="Enter custom text, announcements, or details..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {newBlockType === 'custom_cta' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={newBlockButtonText}
                      onChange={(e) => setNewBlockButtonText(e.target.value)}
                      placeholder="e.g. Inquire Now"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Button Link / URL
                    </label>
                    <input
                      type="text"
                      value={newBlockButtonUrl}
                      onChange={(e) => setNewBlockButtonUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer"
                >
                  Insert Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmActionModal
        isOpen={!!blockToDelete}
        title={`Remove "${blockToDelete?.title || 'Section Block'}"?`}
        message={`Are you sure you want to remove this section from your portfolio? You can always add it back later using the "Add Block" button.`}
        confirmText="Remove Section"
        cancelText="Keep Section"
        isDestructive={true}
        onConfirm={confirmDeleteBlock}
        onCancel={() => setBlockToDelete(null)}
      />

      {/* Reset Layout Confirmation Dialog */}
      <ConfirmActionModal
        isOpen={isResetConfirmOpen}
        title="Reset Portfolio Sections Layout?"
        message="This will restore the standard portfolio sequence (Hero → Works → About → Skills → Services → Reviews → Media Kit → Contact). Are you sure?"
        confirmText="Reset to Standard Layout"
        cancelText="Cancel"
        isDestructive={false}
        onConfirm={handleResetToDefault}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
