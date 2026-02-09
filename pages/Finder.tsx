import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { sheetService } from '../services/sheetService';
import { Product, PetProfile, SortOption } from '../types';
import { Html5Qrcode } from 'html5-qrcode';
import { useSearchParams } from 'react-router-dom';

const Finder: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pet, setPet] = useState<PetProfile | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [mode, setMode] = useState<'Kat' | 'Hond'>('Kat');
  const [filterGrainFree, setFilterGrainFree] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('score_desc');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Load pet profile
    const storedPet = localStorage.getItem('pet_profile');
    if (storedPet) {
      const p: PetProfile = JSON.parse(storedPet);
      setPet(p);
      setMode(p.species);
    }

    // Load products
    sheetService.getProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });

    // Check query params for initial search or scan trigger
    const querySearch = searchParams.get('q');
    if (querySearch) {
      setSearchTerm(querySearch);
    }

    if (searchParams.get('scan') === 'true') {
      setIsScanning(true);
      // Clean URL params so scan doesn't re-trigger on refresh
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('scan');
        return newParams;
      });
    }
  }, []);

  // Handle Scanner Logic
  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    
    const startScanner = async () => {
      if (isScanning) {
        try {
          await new Promise(r => setTimeout(r, 300));
          
          const elementExists = document.getElementById("reader");
          if (!elementExists) return;

          html5QrCode = new Html5Qrcode("reader");
          await html5QrCode.start(
            { facingMode: "environment" },
            { 
              fps: 15, 
              qrbox: { width: 280, height: 200 },
              aspectRatio: 1.0 
            },
            (decodedText) => {
              setSearchTerm(decodedText);
              setIsScanning(false);
              html5QrCode?.stop().catch(err => console.error("Failed to stop", err));
            },
            () => {}
          );
        } catch (err) {
          console.error("Error starting scanner", err);
          setIsScanning(false);
        }
      }
    };

    if (isScanning) {
      startScanner();
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        if (p.doeldier !== mode) return false;
        if (filterGrainFree && !p.graanvrij) return false;
        if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          return (
            p.naam.toLowerCase().includes(lowerTerm) || 
            p.merk.toLowerCase().includes(lowerTerm) ||
            p.ean.includes(lowerTerm)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'score_desc') return b.score - a.score;
        return a.naam.localeCompare(b.naam);
      });
  }, [products, mode, filterGrainFree, searchTerm, sortOption]);

  // Allergy Check
  const checkAllergy = (product: Product): string | null => {
    if (!pet || !pet.allergies) return null;
    const allergies = pet.allergies.toLowerCase().split(',').map(s => s.trim());
    const ingredients = product.ingredienten.toLowerCase();
    
    for (const allergen of allergies) {
      if (allergen && ingredients.includes(allergen)) {
        return allergen;
      }
    }
    return null;
  };

  return (
    <Layout title={`${mode}voer Zoeker`}>
      {/* Enhanced Shibui Scanner Overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-shibui-paper/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden relative shadow-2xl border border-shibui-stone">
            
            {/* Camera Viewport */}
            <div className="relative aspect-square bg-shibui-ink overflow-hidden">
               <div id="reader" className="w-full h-full scale-110"></div>
               
               {/* Viewfinder UI */}
               <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-64 h-48 relative">
                     {/* Corner Brackets - Elegant Thin Lines */}
                     <div className="absolute top-0 left-0 w-8 h-8 border-t-[1px] border-l-[1px] border-shibui-moss"></div>
                     <div className="absolute top-0 right-0 w-8 h-8 border-t-[1px] border-r-[1px] border-shibui-moss"></div>
                     <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[1px] border-l-[1px] border-shibui-moss"></div>
                     <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[1px] border-r-[1px] border-shibui-moss"></div>
                     
                     {/* Animated Scan Line */}
                     <div className="absolute left-0 right-0 h-[1px] bg-shibui-moss/40 shadow-[0_0_8px_rgba(85,107,47,0.5)] animate-[scan_2s_ease-in-out_infinite]"></div>
                  </div>
               </div>
            </div>

            {/* Scanner Info Area */}
            <div className="p-8 text-center bg-white">
              <h2 className="font-serif text-xl font-bold text-shibui-ink mb-2">Barcode Scannen</h2>
              <p className="text-sm text-gray-400 font-light mb-8 max-w-[200px] mx-auto">Plaats de EAN-code van de verpakking binnen het kader.</p>
              
              <button 
                onClick={() => setIsScanning(false)}
                className="w-full py-4 text-sm font-bold tracking-widest uppercase text-shibui-charcoal hover:text-shibui-moss transition-colors border-t border-shibui-stone -mb-8 -mx-8 bg-shibui-paper/30"
              >
                Sluiten
              </button>
            </div>
          </div>
          
          {/* Subtle footer tip */}
          <p className="mt-8 text-xs text-shibui-charcoal/40 uppercase tracking-[0.2em]">Scanabowl Precision Technology</p>
        </div>
      )}

      {/* CSS for Scan Animation */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { top: 100%; }
        }
      `}</style>

      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl shadow-soft border border-shibui-stone mb-6 space-y-4 md:flex md:space-y-0 md:items-center md:gap-4 sticky top-16 md:top-0 md:static z-10">
        
        {/* Search */}
        <div className="relative flex-1 flex gap-2">
          <div className="relative flex-1">
             <input
              type="text"
              placeholder="Zoek merk, naam of EAN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-shibui-paper rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-shibui-moss transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <button 
            onClick={() => setIsScanning(true)}
            className="bg-shibui-charcoal text-white px-4 rounded-xl flex items-center justify-center hover:bg-black transition-colors"
            title="Scan Barcode"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex items-center justify-between gap-4 md:gap-6 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setMode(mode === 'Kat' ? 'Hond' : 'Kat')}
            className="flex items-center space-x-2 text-sm font-medium text-shibui-charcoal hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            <span className={mode === 'Kat' ? 'text-shibui-moss' : 'text-gray-400'}>Kat</span>
            <div className="w-8 h-4 bg-gray-200 rounded-full relative">
              <div className={`absolute w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${mode === 'Hond' ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
            <span className={mode === 'Hond' ? 'text-blue-600' : 'text-gray-400'}>Hond</span>
          </button>

          <button 
            onClick={() => setFilterGrainFree(!filterGrainFree)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${filterGrainFree ? 'bg-green-100 border-green-200 text-green-800' : 'bg-white border-gray-200 text-gray-500'}`}
          >
            Graanvrij
          </button>

          <select 
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="text-xs bg-transparent border-none text-gray-500 font-medium focus:ring-0 cursor-pointer whitespace-nowrap"
          >
            <option value="score_desc">Score (Hoog-Laag)</option>
            <option value="alpha_asc">Alfabetisch</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <svg className="animate-spin h-8 w-8 text-shibui-moss mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Producten laden...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
           {searchTerm ? `Geen producten gevonden voor "${searchTerm}"` : 'Geen producten gevonden.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => {
             const allergy = checkAllergy(product);
             return (
              <div 
                key={product.id} 
                onClick={() => setSelectedProduct(product)}
                className="bg-white rounded-xl p-5 shadow-sm border border-shibui-stone cursor-pointer hover:shadow-md hover:border-shibui-moss/50 transition-all relative overflow-hidden flex flex-col justify-between h-full"
              >
                {allergy && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold z-10">
                    ALLERGIE
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div className="pr-4">
                    <h3 className="font-bold text-shibui-charcoal text-lg leading-tight mb-1">{product.naam}</h3>
                    <p className="text-xs text-gray-500 font-medium">{product.merk}</p>
                  </div>
                  
                  <div className={`
                    shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2
                    ${product.score >= 8 ? 'border-green-500 text-green-700 bg-green-50' : 
                      product.score >= 6 ? 'border-orange-400 text-orange-700 bg-orange-50' : 
                      'border-red-400 text-red-700 bg-red-50'}
                  `}>
                    {product.score}
                  </div>
                </div>

                <div className="mt-auto">
                    <div className="flex gap-2 flex-wrap">
                       {product.graanvrij && <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-md border border-green-100">Graanvrij</span>}
                       <span className="text-[10px] bg-gray-50 text-gray-600 px-2 py-0.5 rounded-md border border-gray-100">{product.doeldier}</span>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal Overlay */}
      {selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          allergyMatch={checkAllergy(selectedProduct)}
        />
      )}
    </Layout>
  );
};

// Sub-component for Details
const ProductDetailModal: React.FC<{ product: Product, onClose: () => void, allergyMatch: string | null }> = ({ product, onClose, allergyMatch }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-4">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="bg-white w-full max-w-md md:max-w-lg h-[90vh] md:h-auto md:max-h-[85vh] md:rounded-2xl rounded-t-3xl overflow-y-auto flex flex-col shadow-2xl animate-slide-up relative z-10">
        <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-serif font-bold text-xl text-shibui-ink">Details</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-shibui-charcoal">{product.naam}</h3>
              <p className="text-shibui-moss font-medium">{product.merk}</p>
            </div>
            <div className="text-center">
              <span className={`block text-3xl font-bold ${
                product.score >= 8 ? 'text-green-600' : 
                product.score >= 6 ? 'text-orange-600' : 'text-red-600'
              }`}>{product.score}</span>
              <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest">Score</span>
            </div>
          </div>

          {/* Score Explanation Section - Elegantly styled */}
          {product.score_explanation && (
            <div className="bg-white border border-shibui-stone rounded-2xl p-5 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-shibui-moss/30"></div>
               <h4 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2 flex items-center">
                 <svg className="w-3.5 h-3.5 mr-1.5 text-shibui-moss" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 Score Toelichting
               </h4>
               <p className="text-sm text-shibui-charcoal leading-relaxed italic">
                 "{product.score_explanation}"
               </p>
            </div>
          )}

          {allergyMatch && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 animate-pulse">
              <svg className="w-6 h-6 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <div>
                <h4 className="font-bold text-red-700 text-sm">Let op: Allergie Match</h4>
                <p className="text-xs text-red-600 mt-1">Dit product bevat <strong>{allergyMatch}</strong>.</p>
              </div>
            </div>
          )}

          <div className="bg-shibui-paper p-4 rounded-xl border border-shibui-stone">
            <h4 className="font-serif font-bold mb-3 text-shibui-ink">Analyse</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                {product.graanvrij ? (
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                ) : (
                   <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                )}
                <span>{product.graanvrij ? 'Graanvrij recept' : 'Bevat granen'}</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-500">
                <span className="font-mono text-xs border border-gray-300 rounded px-1 text-gray-400">EAN</span>
                <span className="tracking-widest">{product.ean}</span>
              </li>
            </ul>
          </div>

          <div>
             <h4 className="font-serif font-bold mb-2 text-shibui-ink">Ingrediënten</h4>
             <p className="text-sm leading-relaxed text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">{product.ingredienten}</p>
          </div>
          <div>
             <h4 className="font-serif font-bold mb-2 text-shibui-ink">Analytische bestanddelen</h4>
             <p className="text-sm text-gray-600 italic border-l-2 border-shibui-moss/50 pl-3">{product.analyse}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finder;