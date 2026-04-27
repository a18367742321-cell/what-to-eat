export interface Restaurant {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  distance: number;
  rating?: number;
  phone?: string;
  openHours?: string;
  category: string;
  typecode?: string;
  fullType?: string;
  photos?: string[];
  tabId?: 'restaurant' | 'teatime';
}

export interface SearchParams {
  address: string;
  radius: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}
