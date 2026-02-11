import { Product, Blog, Brand } from '../types';
import Papa from 'papaparse';

const BASE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAA3Bq1al30dn-M7LLqt86-eIXHyIvsGsHE2b0_ehVhAcEevytsFmIbm4Iz5lzXc47UKNP19Zu4Bty/pub?output=csv';

const PRODUCTS_GID = '0'; 
const BLOGS_GID = '966661590'; 
const BRANDS_GID = '898173781'; 

/**
 * Helper functie om afbeelding URL's te optimaliseren.
 * Ondersteunt nu specifiek Imgur en Google Drive links.
 */
const formatImageUrl = (url: string): string => {
  if (!url || url.trim() === '') return 'https://picsum.photos/800/400?grayscale';
  
  const cleanUrl = url.trim();

  // Optimalisatie voor Imgur
  if (cleanUrl.includes('imgur.com') && !cleanUrl.includes('i.imgur.com')) {
    if (!cleanUrl.includes('/a/') && !cleanUrl.includes('/gallery/')) {
      const parts = cleanUrl.split('/');
      const id = parts[parts.length - 1];
      if (id) return `https://i.imgur.com/${id}.jpg`;
    }
  }
  
  // Optimalisatie voor Google Drive (als fallback)
  if (cleanUrl.includes('drive.google.com')) {
    const id = cleanUrl.split('/d/')[1]?.split('/')[0] || cleanUrl.split('id=')[1]?.split('&')[0];
    if (id) return `https://lh3.googleusercontent.com/u/0/d/${id}`;
  }
  
  return cleanUrl;
};

const fetchTab = async (gid: string): Promise<any[]> => {
  try {
    const response = await fetch(`${BASE_URL}&gid=${gid}`);
    if (!response.ok) throw new Error('Network response was not ok');
    const csvText = await response.text();
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: () => resolve([]),
      });
    });
  } catch (error) {
    console.error(`Error fetching tab ${gid}:`, error);
    return [];
  }
};

export const sheetService = {
  getProducts: async (): Promise<Product[]> => {
    const data = await fetchTab(PRODUCTS_GID);
    return data.map((row: any, index: number) => {
      const getVal = (keyPart: string) => {
        const key = Object.keys(row).find(k => k.toLowerCase().includes(keyPart));
        return key ? row[key] : '';
      };

      return {
        id: getVal('id') || index.toString(),
        ean: getVal('ean') || getVal('barcode') || '',
        naam: getVal('naam') || getVal('product') || 'Naamloos',
        merk: getVal('merk') || getVal('brand') || 'Onbekend',
        doeldier: getVal('doeldier')?.toLowerCase().includes('hond') ? 'Hond' : 'Kat',
        ingredienten: getVal('ingredienten') || getVal('samenstelling') || '',
        analyse: getVal('analyse') || '',
        graanvrij: /ja|yes|true|1/i.test(getVal('graanvrij') || ''),
        score: parseFloat(getVal('score')) || 0,
        score_explanation: getVal('explanation') || getVal('uitleg') || getVal('score_explanation') || '',
        url: getVal('url') || getVal('link') || getVal('shop') || '',
      } as Product;
    });
  },

  getBlogs: async (): Promise<Blog[]> => {
    const data = await fetchTab(BLOGS_GID);
    const today = new Date();

    return data
      .map((row: any, index: number) => {
        const rawImageUrl = row['picture'] || row['afbeelding'] || '';
        return {
          id: index.toString(),
          title: row['titel'] || row['title'] || 'Geen titel',
          content: row['content'] || '',
          image_url: formatImageUrl(rawImageUrl),
          published_at: row['publishing_date'] || row['datum'] || new Date().toISOString(),
        } as Blog;
      })
      .filter(blog => new Date(blog.published_at) <= today)
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
  },

  getBrands: async (): Promise<Brand[]> => {
    const data = await fetchTab(BRANDS_GID);
    return data.map((row: any, index: number) => {
      return {
        id: index.toString(),
        name: row['name'] || row['naam'] || 'Onbekend merk',
        description: row['description'] || row['beschrijving'] || '',
        website_url: row['website'] || '',
        logo_url: '', 
        rating: 5, 
      } as Brand;
    });
  }
};