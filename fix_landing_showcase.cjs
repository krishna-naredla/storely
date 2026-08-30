const fs = require('fs');
const file = 'src/components/landing/MasterLandingView.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetHero = `                     <img 
                       src="/ladingpage.jpeg" 
                       alt="Storelly Landing" 
                       className="max-w-full h-auto object-contain hover:scale-105 transition-transform duration-700"
                     />`;

const cssMockup = `
                      <div className="w-full bg-slate-50 border-[6px] border-slate-900 rounded-[2.5rem] p-4 shadow-2xl relative overflow-hidden transform hover:scale-105 transition-transform duration-700">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-slate-900 rounded-b-xl z-10"></div>
                        
                        <div className="space-y-4 pt-4">
                          {/* 1) Physical Product */}
                          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                               <span className="text-2xl">🍯</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 truncate">Chicken Pickle</h4>
                              <p className="text-xs text-slate-500 font-medium">₹249</p>
                            </div>
                            <button className="px-3 py-1.5 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg whitespace-nowrap">Buy Now</button>
                          </div>

                          {/* 2) Digital Product */}
                          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                               <FileText className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 truncate">TSPSC Notes PDF</h4>
                              <p className="text-xs text-slate-500 font-medium">₹49</p>
                            </div>
                            <button className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg whitespace-nowrap shadow-sm shadow-emerald-200">Buy Now</button>
                          </div>

                          {/* 3) Booking Service */}
                          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                            <div className="w-14 h-14 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
                               <Calendar className="w-6 h-6 text-rose-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 truncate">1:1 Consultation</h4>
                              <p className="text-xs text-slate-500 font-medium">₹499</p>
                            </div>
                            <button className="px-3 py-1.5 border border-emerald-600 text-emerald-700 font-bold text-xs rounded-lg whitespace-nowrap">Book Now</button>
                          </div>
                          
                          {/* 4) Free Digital */}
                          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                            <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
                               <Zap className="w-6 h-6 text-sky-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 truncate">Startup Guide</h4>
                              <p className="text-xs font-bold text-emerald-600">Free</p>
                            </div>
                            <button className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg whitespace-nowrap">Get Free</button>
                          </div>
                        </div>
                      </div>
`;

if (code.includes('src="/ladingpage.jpeg"')) {
  code = code.replace(targetHero, cssMockup);
}

fs.writeFileSync(file, code);
