sed -i '/<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">/,/<\/header>/c\
          {social && (\
            <div className="flex items-center gap-2">\
              {social.instagram && <a href={social.instagram.startsWith("http") ? social.instagram : `https://${social.instagram}`} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-pink-600 transition"><Instagram className="w-4 h-4" /></a>}\
              {social.youtube && <a href={social.youtube.startsWith("http") ? social.youtube : `https://${social.youtube}`} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-red-600 transition"><Youtube className="w-4 h-4" /></a>}\
              {social.twitter && <a href={social.twitter.startsWith("http") ? social.twitter : `https://${social.twitter}`} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-400 transition"><Twitter className="w-4 h-4" /></a>}\
            </div>\
          )}\
        </div>\
      </header>\
' src/components/portfolio/StandalonePortfolioView.tsx
