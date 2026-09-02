import React, { useState, useEffect } from 'react';
import {
  FileText,
  Video,
  Image as ImageIcon,
  Plus,
  Search,
  Download,
  Trash2,
  Edit2,
  Copy,
  ExternalLink,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  RefreshCw,
  Sparkles,
  Layers,
  Clock,
  Eye,
  EyeOff,
  Tag,
  Check,
  FileArchive,
  Info,
  DollarSign,
  Share2,
} from 'lucide-react';
import { DigitalProduct, DigitalProductType, DigitalProductStatus, DigitalFileItem } from '../../types';
import {
  getDigitalProducts,
  createDigitalProduct,
  updateDigitalProduct,
  deleteDigitalProduct,
  toggleDigitalProductStatus,
  duplicateDigitalProduct,
} from '../../services/firebaseService';
import { uploadDigitalFileToCloudinary, uploadToCloudinary, deleteImageFromStorage } from '../../services/cloudinary';

interface DigitalProductsManagerProps {
  businessId: string;
  businessName?: string;
}

export const DigitalProductsManager: React.FC<DigitalProductsManagerProps> = ({
  businessId,
  businessName = 'Storelly',
}) => {
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DigitalProduct | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [coverUploadProgress, setCoverUploadProgress] = useState<number | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<DigitalProductType>('PDF');
  const [price, setPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number | undefined>(undefined);
  const [isFree, setIsFree] = useState<boolean>(false);
  const [coverImage, setCoverImage] = useState<string>('');
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [status, setStatus] = useState<DigitalProductStatus>('active');
  const [downloadLimit, setDownloadLimit] = useState<number | undefined>(undefined);
  const [courseLessons, setCourseLessons] = useState<DigitalFileItem[]>([]);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  // WhatsApp & Signed Link Test Modal
  const [testLinkModalProduct, setTestLinkModalProduct] = useState<DigitalProduct | null>(null);
  const [testCustomerPhone, setTestCustomerPhone] = useState('');
  const [testCustomerName, setTestCustomerName] = useState('');
  const [generatedSignedLink, setGeneratedSignedLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [whatsAppDeliveryUrl, setWhatsAppDeliveryUrl] = useState<string | null>(null);

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, toastType: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type: toastType });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const items = await getDigitalProducts(businessId);
      setProducts(items);
    } catch (err) {
      console.error('Error loading digital products:', err);
      showToast('Failed to load digital products', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      loadProducts();
    }
  }, [businessId]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setTitle('');
    setDescription('');
    setType('PDF');
    setPrice(199);
    setSalePrice(undefined);
    setIsFree(false);
    setCoverImage('');
    setFileUrls([]);
    setFileName('');
    setFileSize('');
    setStatus('active');
    setDownloadLimit(undefined);
    setCourseLessons([]);
    setNewLessonTitle('');
    setUploadProgress(null);
    setCoverUploadProgress(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: DigitalProduct) => {
    setEditingProduct(product);
    setTitle(product.title);
    setDescription(product.description || '');
    setType(product.type || 'PDF');
    setPrice(product.price);
    setSalePrice(product.salePrice);
    setIsFree(product.isFree || product.price === 0);
    setCoverImage(product.coverImage || '');
    setFileUrls(product.fileUrls || []);
    setFileName(product.fileName || '');
    setFileSize(product.fileSize || '');
    setStatus(product.status || 'active');
    setDownloadLimit(product.downloadLimit);
    setCourseLessons(product.courseLessons || []);
    setNewLessonTitle('');
    setUploadProgress(null);
    setCoverUploadProgress(null);
    setIsModalOpen(true);
  };

  // Cover image upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCoverUploadProgress(10);
      const url = await uploadToCloudinary(file, (p) => setCoverUploadProgress(p));
      setCoverImage(url);
      showToast('Cover image uploaded successfully');
    } catch (err) {
      console.error('Cover upload error:', err);
      showToast('Failed to upload cover image', 'error');
    } finally {
      setCoverUploadProgress(null);
    }
  };

  // Main digital file upload (PDF, eBook, ZIP, Image, etc.)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadProgress(10);
      const res = await uploadDigitalFileToCloudinary(file, (p) => setUploadProgress(p));
      setFileUrls([res.url]);
      setFileName(file.name);
      
      const formattedSize = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;
      setFileSize(formattedSize);

      showToast(`File "${file.name}" uploaded successfully!`);
    } catch (err: any) {
      console.error('File upload error:', err);
      showToast(err.message || 'Failed to upload digital file', 'error');
    } finally {
      setUploadProgress(null);
    }
  };

  // Course lesson file upload
  const handleAddCourseLessonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadProgress(10);
      const res = await uploadDigitalFileToCloudinary(file, (p) => setUploadProgress(p));
      const formattedSize = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      const lessonTitle = newLessonTitle.trim() || file.name.replace(/\.[^/.]+$/, "");
      const newLesson: DigitalFileItem = {
        id: 'les_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        title: lessonTitle,
        url: res.url,
        fileId: res.publicId,
        fileType: file.type || 'lesson',
        fileSize: formattedSize,
      };

      setCourseLessons([...courseLessons, newLesson]);
      setFileUrls([...fileUrls, res.url]);
      setNewLessonTitle('');
      showToast(`Lesson "${lessonTitle}" added!`);
    } catch (err: any) {
      console.error('Lesson upload error:', err);
      showToast('Failed to upload lesson file', 'error');
    } finally {
      setUploadProgress(null);
    }
  };

  const removeCourseLesson = (id: string) => {
    setCourseLessons(courseLessons.filter((l) => l.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a product title', 'error');
      return;
    }

    if (!isFree && price <= 0) {
      showToast('Please enter a valid price or mark as Free', 'error');
      return;
    }

    if (!coverImage) {
      showToast('Please upload a cover thumbnail image', 'error');
      return;
    }

    if (fileUrls.length === 0 && courseLessons.length === 0) {
      showToast('Please upload at least one downloadable file or lesson', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        type,
        price: isFree ? 0 : Number(price),
        salePrice: isFree || !salePrice ? undefined : Number(salePrice),
        isFree,
        coverImage,
        fileUrls: courseLessons.length > 0 ? courseLessons.map((l) => l.url) : fileUrls,
        fileName: fileName || (courseLessons.length > 0 ? `${courseLessons.length} Lessons Course` : title),
        fileSize,
        status,
        downloadLimit: downloadLimit ? Number(downloadLimit) : undefined,
        courseLessons: type === 'Course' ? courseLessons : undefined,
      };

      if (editingProduct) {
        await updateDigitalProduct(businessId, editingProduct.id, payload);
        showToast('Digital product updated successfully!');
      } else {
        await createDigitalProduct(businessId, payload);
        showToast('Digital product published successfully!');
      }

      setIsModalOpen(false);
      await loadProducts();
    } catch (err: any) {
      console.error('Error saving digital product:', err);
      showToast(err.message || 'Failed to save product', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product: DigitalProduct) => {
    if (!window.confirm(`Are you sure you want to delete "${product.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteDigitalProduct(businessId, product.id);
      showToast('Product deleted successfully');
      setProducts(products.filter((p) => p.id !== product.id));
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete product', 'error');
    }
  };

  const handleToggleStatus = async (product: DigitalProduct) => {
    try {
      const nextStatus = await toggleDigitalProductStatus(businessId, product.id, product.status);
      setProducts(products.map((p) => (p.id === product.id ? { ...p, status: nextStatus } : p)));
      showToast(`Product is now ${nextStatus === 'active' ? 'Active' : 'Inactive'}`);
    } catch (err) {
      console.error('Toggle status error:', err);
      showToast('Failed to update status', 'error');
    }
  };

  const handleDuplicate = async (product: DigitalProduct) => {
    try {
      const dup = await duplicateDigitalProduct(businessId, product);
      setProducts([dup, ...products]);
      showToast(`Duplicated as "${dup.title}"`);
    } catch (err) {
      console.error('Duplicate error:', err);
      showToast('Failed to duplicate product', 'error');
    }
  };

  // Test 10-Minute Signed Link Generation and WhatsApp Delivery
  const openTestLinkModal = (product: DigitalProduct) => {
    setTestLinkModalProduct(product);
    setTestCustomerPhone('');
    setTestCustomerName('');
    setGeneratedSignedLink(null);
    setWhatsAppDeliveryUrl(null);
    setCopiedLink(false);
  };

  const generateTestSignedLink = async () => {
    if (!testLinkModalProduct) return;
    setIsGeneratingLink(true);
    try {
      const primaryUrl = testLinkModalProduct.fileUrls?.[0] || testLinkModalProduct.courseLessons?.[0]?.url || '';
      
      const res = await fetch('/api/digital/whatsapp-deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone: testCustomerPhone || '919876543210',
          customerName: testCustomerName || 'Creator Partner',
          productTitle: testLinkModalProduct.title,
          orderId: 'test_ord_' + Date.now().toString().slice(-6),
          fileUrl: primaryUrl,
          fileName: testLinkModalProduct.fileName || testLinkModalProduct.title,
          merchantName: businessName,
        }),
      });

      const data = await res.json();
      if (data.downloadUrl) {
        setGeneratedSignedLink(data.downloadUrl);
        setWhatsAppDeliveryUrl(data.whatsAppUrl || null);
        showToast('Temporary 10-minute signed link generated!');
      } else {
        throw new Error(data.error || 'Failed to generate link');
      }
    } catch (err: any) {
      console.error('Error generating test link:', err);
      showToast(err.message || 'Error generating link', 'error');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showToast('Link copied to clipboard!');
  };

  // Filtered List
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedTypeFilter === 'all' || p.type.toLowerCase() === selectedTypeFilter.toLowerCase();
    const matchesStatus = selectedStatusFilter === 'all' || p.status === selectedStatusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (pType: DigitalProductType) => {
    switch (pType) {
      case 'Course':
        return <Video className="w-4 h-4 text-purple-600" />;
      case 'Image':
        return <ImageIcon className="w-4 h-4 text-emerald-600" />;
      case 'ZIP':
        return <FileArchive className="w-4 h-4 text-amber-600" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-6" id="digital-products-manager">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-5 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
              : 'bg-rose-900 text-rose-50 border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wide">
              Direct Buy • No Cart
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide">
              10-Min Signed WhatsApp Links
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Digital Products</h2>
          <p className="text-xs text-slate-500">
            Create, manage, and instantly deliver PDFs, eBooks, video courses, and graphic assets directly to customers upon verified payment.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          id="btn-add-digital-product"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Digital Product
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Products</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{products.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
          <p className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">Active Live</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {products.filter((p) => p.status === 'active').length}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
          <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider">Free Lead Magnets</p>
          <p className="text-xl font-bold text-indigo-600 mt-1">
            {products.filter((p) => p.isFree || p.price === 0).length}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200">
          <p className="text-[11px] font-semibold text-purple-500 uppercase tracking-wider">Paid Items</p>
          <p className="text-xl font-bold text-purple-600 mt-1">
            {products.filter((p) => !p.isFree && p.price > 0).length}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search digital products by title or description..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(['all', 'PDF', 'Course', 'Image', 'ZIP', 'Template'] as const).map((tFilter) => (
            <button
              key={tFilter}
              onClick={() => setSelectedTypeFilter(tFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedTypeFilter.toLowerCase() === tFilter.toLowerCase()
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tFilter === 'all' ? 'All Types' : tFilter}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <select
          value={selectedStatusFilter}
          onChange={(e) => setSelectedStatusFilter(e.target.value)}
          className="w-full md:w-36 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 font-medium focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs text-slate-500">Loading digital products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Digital Products Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || selectedTypeFilter !== 'all'
              ? 'Try clearing your search query or type filters.'
              : 'Upload your first digital eBook, PDF guide, course, or graphic asset to start selling instantly!'}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Create Digital Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const isFreeProduct = product.isFree || product.price === 0;
            const primaryFile = product.fileUrls?.[0] || '';
            return (
              <div
                key={product.id}
                id={`digital-item-${product.id}`}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden group hover:shadow-md ${
                  product.status === 'inactive' ? 'opacity-65 border-slate-200 bg-slate-50/50' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Thumbnail & Badges */}
                  <div className="relative aspect-video bg-slate-100 overflow-hidden border-b border-slate-100">
                    <img
                      src={product.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80'}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur-xs text-slate-800 shadow-xs flex items-center gap-1">
                        {getTypeIcon(product.type)}
                        {product.type}
                      </span>
                      {product.type === 'Course' && product.courseLessons && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-900/80 backdrop-blur-xs text-purple-100 shadow-xs">
                          {product.courseLessons.length} Lessons
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <button
                        onClick={() => handleToggleStatus(product)}
                        title={`Click to ${product.status === 'active' ? 'deactivate' : 'activate'}`}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-xs transition flex items-center gap-1 cursor-pointer ${
                          product.status === 'active'
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-slate-700 text-white hover:bg-slate-800'
                        }`}
                      >
                        {product.status === 'active' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {product.status}
                      </button>
                    </div>

                    {/* Price Pill */}
                    <div className="absolute bottom-2.5 right-2.5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-slate-900/90 backdrop-blur-xs text-white shadow-sm">
                        {isFreeProduct ? (
                          <span className="text-emerald-400">FREE</span>
                        ) : (
                          <>
                            ₹{product.price}
                            {product.salePrice && product.salePrice > product.price && (
                              <span className="text-[10px] text-slate-400 line-through ml-1 font-normal">
                                ₹{product.salePrice}
                              </span>
                            )}
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="p-4 space-y-2">
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition">
                      {product.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {product.description || 'No description provided.'}
                    </p>

                    {/* File Meta Info */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="truncate max-w-[140px] font-mono text-[10px] text-slate-400">
                        {product.fileName || (primaryFile ? '1 Digital File' : 'No file attached')}
                      </span>
                      {product.fileSize && (
                        <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                          {product.fileSize}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-1">
                  <button
                    onClick={() => openTestLinkModal(product)}
                    title="Generate 10-Min Signed Link & WhatsApp Delivery"
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Test Link & WhatsApp
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(product)}
                      title="Duplicate Product"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(product)}
                      title="Edit Product"
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      title="Delete Product"
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingProduct ? 'Edit Digital Product' : 'Add New Digital Product'}
                </h3>
                <p className="text-xs text-slate-500">
                  Direct one-click purchase with instant temporary signed link delivery.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Ultimate React Masterclass Guide (PDF + Templates)"
                  required
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Product Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['PDF', 'Course', 'Image', 'ZIP'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setType(t)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        type === t
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {getTypeIcon(t)}
                      {t === 'Course' ? 'Course / Video' : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe what customers will get in this digital download..."
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Pricing Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Product Pricing</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFree}
                      onChange={(e) => setIsFree(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-emerald-600">Free Download / Lead Magnet</span>
                  </label>
                </div>

                {!isFree && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Price (₹) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={price || ''}
                          onChange={(e) => setPrice(Number(e.target.value))}
                          placeholder="199"
                          required={!isFree}
                          className="w-full pl-7 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Original / Strike-through Price (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={salePrice || ''}
                          onChange={(e) => setSalePrice(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="499 (Optional discount)"
                          className="w-full pl-7 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cover Thumbnail Image <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  {coverImage ? (
                    <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCoverImage('')}
                        className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-xs font-bold"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <label className="w-full sm:w-auto flex-1 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 hover:bg-indigo-50/20">
                      <Upload className="w-5 h-5 text-indigo-500 mb-1" />
                      <span className="text-xs font-bold text-slate-700">Upload Cover Image</span>
                      <span className="text-[10px] text-slate-400">PNG, JPG, WebP up to 10MB</span>
                      <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                    </label>
                  )}
                  {coverUploadProgress !== null && (
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{coverUploadProgress}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Digital File Upload or Course Builder */}
              {type !== 'Course' ? (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Downloadable Digital File <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      Secured via Signed Upload
                    </span>
                  </div>

                  {fileUrls.length > 0 ? (
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          {getTypeIcon(type)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 truncate">{fileName || 'Uploaded File'}</p>
                          <p className="text-[10px] text-slate-400">{fileSize || 'Uploaded file ready'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFileUrls([]);
                          setFileName('');
                          setFileSize('');
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 px-2 py-1 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-white hover:bg-indigo-50/20">
                      {uploadProgress !== null ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                          <span className="text-xs font-bold text-indigo-600">Uploading File... {uploadProgress}%</span>
                          <div className="w-48 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-indigo-600 h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-indigo-500 mb-1" />
                          <span className="text-xs font-bold text-slate-800">Click or Drag & Drop File to Upload</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            PDF, EPUB, ZIP, MP4, MP3, PNG, PSD, etc.
                          </span>
                          <input type="file" onChange={handleFileUpload} className="hidden" />
                        </>
                      )}
                    </label>
                  )}
                </div>
              ) : (
                /* Course Multi-Lesson Builder */
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Course Lessons & Video Modules <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                      {courseLessons.length} Modules Added
                    </span>
                  </div>

                  {courseLessons.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {courseLessons.map((lesson, idx) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 truncate">{lesson.title}</p>
                              <span className="text-[10px] text-slate-400">{lesson.fileSize || 'Video/PDF'}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCourseLesson(lesson.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Lesson Input and File */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <input
                      type="text"
                      value={newLessonTitle}
                      onChange={(e) => setNewLessonTitle(e.target.value)}
                      placeholder="Module Title (e.g. Chapter 1: Introduction to Next.js)"
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                    <label className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer transition">
                      {uploadProgress !== null ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading ({uploadProgress}%)...
                        </span>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Upload Lesson Video / File
                        </>
                      )}
                      <input type="file" onChange={handleAddCourseLessonFile} className="hidden" />
                    </label>
                  </div>
                </div>
              )}

              {/* Status and Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Publish Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DigitalProductStatus)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium focus:outline-none"
                  >
                    <option value="active">Active (Visible & Buyable)</option>
                    <option value="inactive">Inactive (Draft / Hidden)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Download Limit per Buyer (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={downloadLimit || ''}
                    onChange={(e) => setDownloadLimit(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingProduct ? 'Save Changes' : 'Publish Digital Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEST SIGNED LINK & WHATSAPP DELIVERY MODAL */}
      {testLinkModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">10-Min Temporary Signed Link & WhatsApp</h3>
                  <p className="text-[11px] text-slate-500">Test temporary secure delivery</p>
                </div>
              </div>
              <button
                onClick={() => setTestLinkModalProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3">
              <img
                src={testLinkModalProduct.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80'}
                alt={testLinkModalProduct.title}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div className="truncate">
                <h4 className="text-xs font-bold text-slate-900 truncate">{testLinkModalProduct.title}</h4>
                <p className="text-[11px] text-slate-500">
                  {testLinkModalProduct.isFree ? 'Free Download' : `₹${testLinkModalProduct.price}`} • {testLinkModalProduct.type}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Recipient Phone (WhatsApp)
                </label>
                <input
                  type="tel"
                  value={testCustomerPhone}
                  onChange={(e) => setTestCustomerPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={testCustomerName}
                  onChange={(e) => setTestCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={generateTestSignedLink}
                disabled={isGeneratingLink}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGeneratingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate 10-Minute Signed Link
              </button>
            </div>

            {/* Generated Link Display */}
            {generatedSignedLink && (
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    Temporary Signed Link (10 Minutes)
                  </span>
                  <span className="text-[10px] bg-emerald-200/70 px-1.5 py-0.5 rounded text-emerald-900">
                    HMAC Verified
                  </span>
                </div>

                <div className="p-2 bg-white rounded-xl border border-emerald-200 font-mono text-[10px] text-slate-700 break-all select-all">
                  {generatedSignedLink}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(generatedSignedLink)}
                    className="flex-1 py-2 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </button>

                  <a
                    href={generatedSignedLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Test Download
                  </a>
                </div>

                {whatsAppDeliveryUrl && (
                  <a
                    href={whatsAppDeliveryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <Send className="w-4 h-4" /> Open in WhatsApp & Send to Customer
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
