import React, { useState } from 'react';
import { Plus, Minus, Mail, Phone, MapPin } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { q: "How does Storelly work?", a: "Storelly is a platform that lets you create a digital storefront for your business in minutes. Just sign up, add your business details, upload your catalog, and share your store link with customers." },
    { q: "Can I try Storelly for free?", a: "Yes! We offer a 14-day free trial on our Pro plan, and a forever-free Basic plan to get you started with no credit card required." },
    { q: "Can I use my own domain?", a: "Absolutely. On our Pro and Premium plans, you can connect your own custom domain (e.g., yourstore.com) to your Storelly storefront." },
    { q: "Is Storelly suitable for homemade businesses?", a: "Yes! Storelly is perfect for home bakers, homemade pickle sellers, cloud kitchens, and freelancers. It's built to be flexible for any local business." },
    { q: "Do my customers need to download an app?", a: "No! Your Storelly storefront is a mobile-friendly web app. Customers can open your link in any browser, view products, and place orders directly." }
  ];

  return (
    <section id="faq" className="py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* FAQ Accordion */}
          <div>
            <h4 className="text-emerald-600 font-bold uppercase tracking-wider text-sm mb-3">Frequently Asked Questions</h4>
            <h2 className="text-4xl font-black text-slate-900 mb-8">Got Questions?<br/>We Have <span className="text-emerald-600">Answers</span></h2>
            
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-white hover:border-emerald-200 transition-colors">
                  <button 
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="font-bold text-slate-800 pr-8">{faq.q}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${openIndex === i ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {openIndex === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                  </button>
                  {openIndex === i && (
                    <div className="px-6 pb-6 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Details */}
          <div id="contact" className="lg:pl-16 flex flex-col justify-center">
            <h4 className="text-emerald-600 font-bold uppercase tracking-wider text-sm mb-3">Let's Talk</h4>
            <h2 className="text-3xl font-black text-slate-900 mb-4">Contact Us</h2>
            <p className="text-slate-500 mb-8">We're here to help you get your business online. Reach out to our team anytime.</p>
            
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Call Us</p>
                  <p className="font-bold">+91 98765 43210</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Email Us</p>
                  <p className="font-bold">support@storelly.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Visit Us</p>
                  <p className="font-bold">Hyderabad, Telangana, India</p>
                </div>
              </div>
            </div>

            {/* Newsletter Box */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-2">Stay Updated</h3>
              <p className="text-sm text-slate-500 mb-4">Subscribe to our newsletter for business growth tips.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500" />
                <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
