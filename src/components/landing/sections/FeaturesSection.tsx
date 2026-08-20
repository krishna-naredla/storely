import React from 'react';
import { 
  Store, ShoppingBag, ListOrdered, Users, LineChart, MessageSquare, 
  Settings, CreditCard, Box, CalendarClock, Phone, MapPin, 
  Smartphone, Share2, Download, QrCode, CheckCircle2
} from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  return (
    <div className="bg-slate-50 pt-24 pb-32 space-y-32">
      
      {/* About Section */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h4 className="text-emerald-600 font-bold uppercase tracking-wider text-sm mb-3">About Storelly</h4>
            <h2 className="text-4xl font-black text-slate-900 leading-tight mb-6">
              Empowering Local Businesses <span className="text-emerald-600">Digitally</span>
            </h2>
            <p className="text-slate-600 leading-relaxed mb-8">
              Storelly is designed to help local businesses, homemade brands, and service providers go online, reach more customers, and grow faster with powerful tools and simple interfaces. No coding required.
            </p>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Easy to Use</h4>
                  <p className="text-sm text-slate-500">Simple setup in minutes. Manage everything from your phone or desktop.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Box className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">All-in-One Platform</h4>
                  <p className="text-sm text-slate-500">Products, orders, customers, and analytics — everything you need in one place.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                  <LineChart className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Grow Faster</h4>
                  <p className="text-sm text-slate-500">Powerful marketing tools, SEO-friendly storefronts, and digital cards to boost growth.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
             <div className="w-full max-w-md transform hover:scale-105 transition-transform duration-500">
               <img src="/storelly2.jpg.jpeg" alt="Digital Storefront Showcase" className="w-full h-80 object-cover rounded-2xl shadow-xl border border-slate-200" />
             </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h4 className="text-emerald-600 font-bold uppercase tracking-wider text-sm mb-3">Simple Process</h4>
          <h2 className="text-4xl font-black text-slate-900">How Storelly Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { step: '01', title: 'Create Account', desc: 'Sign up with your email or Google account in seconds.' },
            { step: '02', title: 'Setup Business', desc: 'Add your business name, logo, and contact details.' },
            { step: '03', title: 'Add Catalog', desc: 'Upload products, services, or menu items with pricing.' },
            { step: '04', title: 'Share & Grow', desc: 'Share your digital store link and start receiving orders!' }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative text-center hover:shadow-md transition-all">
              <div className="absolute -top-4 -right-4 text-6xl font-black text-slate-50/80 pointer-events-none">{item.step}</div>
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold mx-auto mb-6">
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Business Types */}
      <section className="bg-white py-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-4">Built for Every Local Business</h2>
          <p className="text-slate-500 mb-12 max-w-2xl mx-auto">From retail shops to homemade bakeries, Storelly adapts to your unique business needs.</p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {['Retail Stores', 'Grocery & Supermarts', 'Restaurants & Cafes', 'Homemade Food', 'Pickles & Spices', 'Fashion & Boutiques', 'Beauty Salons', 'Electronics', 'Home Decor', 'Service Providers', 'Freelancers', 'Bakeries', 'Clinics'].map(type => (
              <span key={type} className="px-6 py-3 rounded-full bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors cursor-pointer">
                {type}
              </span>
            ))}
          </div>
          <p className="mt-8 text-sm text-slate-400 font-medium">Don't see your category? You can create a custom business type instantly.</p>
        </div>
      </section>

      {/* Business Modules */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h4 className="text-emerald-600 font-bold uppercase tracking-wider text-sm mb-3">Our Features</h4>
          <h2 className="text-4xl font-black text-slate-900">Everything You Need to Run Your Business</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: <Store />, title: 'Store Management', desc: 'Create your online store with custom branding, banners, and logos.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: <Box />, title: 'Product Management', desc: 'Add unlimited products, categories, prices, and stock inventory.', color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: <ListOrdered />, title: 'Order Management', desc: 'Receive and manage orders easily. Update statuses and notify customers.', color: 'text-amber-600', bg: 'bg-amber-50' },
            { icon: <Users />, title: 'Customer CRM', desc: 'Build customer relationships, track purchase history and grow repeat business.', color: 'text-purple-600', bg: 'bg-purple-50' },
            { icon: <CalendarClock />, title: 'Bookings & Services', desc: 'Let customers book your services with a professional scheduling system.', color: 'text-rose-600', bg: 'bg-rose-50' },
            { icon: <LineChart />, title: 'Analytics Dashboard', desc: 'Get real-time insights on sales, views, and store performance.', color: 'text-teal-600', bg: 'bg-teal-50' }
          ].map((feature, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group">
              <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {React.cloneElement(feature.icon as React.ReactElement, { className: `w-7 h-7 ${feature.color}` })}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Digital Card Section */}
      <section id="card" className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 rounded-[3rem] p-8 lg:p-16 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <div className="order-2 lg:order-1 flex justify-center">
              <div className="w-72 bg-white rounded-3xl shadow-2xl p-6 transform -rotate-3 hover:rotate-0 transition-transform duration-500 border-4 border-slate-100">
                <div className="text-center space-y-4">
                  <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80" className="w-20 h-20 mx-auto rounded-full object-cover border-2 border-emerald-100" />
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Fresh Basket Groceries</h3>
                    <p className="text-xs text-slate-500">Premium quality daily essentials</p>
                  </div>
                  <div className="w-full h-px bg-slate-100"></div>
                  <div className="flex justify-center gap-4 text-slate-600">
                    <Phone className="w-5 h-5" />
                    <MapPin className="w-5 h-5" />
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm">
                    Visit Store
                  </button>
                  <div className="pt-2">
                     <QrCode className="w-24 h-24 mx-auto text-slate-800" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <h4 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-3">Shareable Digital Card</h4>
              <h2 className="text-4xl font-black text-white leading-tight mb-6">
                Turn your business into a shareable digital identity.
              </h2>
              <p className="text-slate-400 leading-relaxed mb-8 text-lg">
                Stop printing paper visiting cards. Storelly generates a rich, interactive digital business card for you automatically. 
              </p>
              <ul className="space-y-4 mb-8 text-slate-300">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Share on WhatsApp & Social Media</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Auto-generated QR Codes</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Direct link to your storefront</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Download as Image/PDF</li>
              </ul>
              <div className="flex gap-4">
                <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors">
                  <Share2 className="w-4 h-4" /> Try Sharing
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
