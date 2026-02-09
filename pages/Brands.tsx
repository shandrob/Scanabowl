import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { sheetService } from '../services/sheetService';
import { Brand } from '../types';

const Brands: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sheetService.getBrands().then((data) => {
      setBrands(data);
      setLoading(false);
    });
  }, []);

  return (
    <Layout title="Merken Gids" showBack={true}>
      {loading ? (
         <div className="text-center py-20 text-gray-400 italic">Merken aan het laden...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {brands.map((brand) => (
            <div key={brand.id} className="bg-white rounded-xl p-6 shadow-soft border border-shibui-stone hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-serif font-bold text-xl text-shibui-charcoal">{brand.name}</h3>
                <div className="flex bg-yellow-50 px-2 py-1 rounded-lg">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star} 
                      className={`w-4 h-4 ${star <= brand.rating ? 'text-yellow-400' : 'text-gray-200'}`} 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-1">
                {brand.description}
              </p>
              
              {brand.website_url && (
                <a 
                  href={brand.website_url.startsWith('http') ? brand.website_url : `https://${brand.website_url}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center justify-center text-xs font-bold text-shibui-moss bg-shibui-moss/10 px-4 py-3 rounded-lg hover:bg-shibui-moss/20 transition-colors w-full md:w-auto"
                >
                  <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                  Bezoek Website
                </a>
              )}
            </div>
          ))}
          {!loading && brands.length === 0 && (
            <div className="text-center py-20 text-gray-400 col-span-full">Geen merken gevonden in de database.</div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Brands;