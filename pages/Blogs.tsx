import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { sheetService } from '../services/sheetService';
import { Blog } from '../types';

const Blogs: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

  useEffect(() => {
    sheetService.getBlogs().then((data) => {
      setBlogs(data);
      setLoading(false);
    });
  }, []);

  if (selectedBlog) {
    return (
      <Layout title="Artikel" showBack={true}>
         <div className="bg-white rounded-2xl overflow-hidden shadow-soft border border-shibui-stone max-w-4xl mx-auto">
            <div className="relative h-64 md:h-96 w-full bg-shibui-stone">
                <img 
                  src={selectedBlog.image_url} 
                  alt={selectedBlog.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Als de afbeelding uit de database niet laadt, gebruik een grijze placeholder
                    (e.target as HTMLImageElement).src = 'https://picsum.photos/800/400?grayscale';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                   <h1 className="text-2xl md:text-4xl font-serif font-bold text-white shadow-sm leading-tight mb-2">
                    {selectedBlog.title}
                   </h1>
                   <div className="text-white/80 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {new Date(selectedBlog.published_at).toLocaleDateString('nl-NL')}
                   </div>
                </div>
            </div>
            
            <div className="p-6 md:p-10">
               <button 
                  onClick={() => setSelectedBlog(null)}
                  className="hidden md:flex items-center text-sm text-gray-500 hover:text-shibui-charcoal mb-6"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Terug naar overzicht
               </button>
               <div className="prose prose-stone leading-relaxed text-gray-700 max-w-none text-lg whitespace-pre-wrap">
                {selectedBlog.content}
               </div>
            </div>
         </div>
      </Layout>
    );
  }

  return (
    <Layout title="Kennisbank">
      {loading ? (
        <div className="text-center py-20 text-gray-400 italic">Blogs aan het ophalen...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map(blog => (
            <div 
              key={blog.id} 
              onClick={() => setSelectedBlog(blog)}
              className="group bg-white rounded-2xl overflow-hidden shadow-soft border border-shibui-stone cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              <div className="h-48 w-full overflow-hidden bg-shibui-stone">
                 <img 
                   src={blog.image_url} 
                   alt={blog.title} 
                   className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                   onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://picsum.photos/800/400?grayscale';
                  }}
                 />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-serif font-bold text-xl text-shibui-charcoal mb-2 leading-tight group-hover:text-shibui-moss transition-colors">
                  {blog.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1">
                  {blog.content}
                </p>
                <div className="flex items-center text-shibui-moss text-xs font-bold uppercase tracking-wide mt-auto">
                  Lees artikel
                  <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
              </div>
            </div>
          ))}
          {blogs.length === 0 && (
            <div className="text-center text-gray-400 col-span-full py-20">
              Er zijn momenteel geen blogs beschikbaar die al gepubliceerd mogen worden.
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Blogs;