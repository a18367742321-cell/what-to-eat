import { create } from 'zustand';
import { Restaurant, SearchParams } from '../types';

interface RestaurantStore {
  restaurants: Restaurant[];
  searchParams: SearchParams;
  isLoading: boolean;
  error: string | null;
  selectedRestaurant: Restaurant | null;
  
  setRestaurants: (restaurants: Restaurant[]) => void;
  setSearchParams: (params: SearchParams) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedRestaurant: (restaurant: Restaurant | null) => void;
  
  randomSelect: (list?: Restaurant[]) => void;
}

export const useRestaurantStore = create<RestaurantStore>((set, get) => ({
  restaurants: [],
  searchParams: {
    address: '',
    radius: 500,
  },
  isLoading: false,
  error: null,
  selectedRestaurant: null,

  setRestaurants: (restaurants) => set({ restaurants }),
  setSearchParams: (searchParams) => set({ searchParams }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSelectedRestaurant: (selectedRestaurant) => set({ selectedRestaurant }),

  randomSelect: (list?: Restaurant[]) => {
    const targetList = list || get().restaurants;
    if (targetList.length === 0) return;
    
    // 过滤出评分 >= 4.0 的餐厅作为推荐池
    let recommendPool = targetList.filter(r => (r.rating || 0) >= 4.0);
    
    // 如果没有评分 >= 4.0 的，就退回到整个列表随机
    if (recommendPool.length === 0) {
      recommendPool = targetList;
    }
    
    const randomIndex = Math.floor(Math.random() * recommendPool.length);
    set({ selectedRestaurant: recommendPool[randomIndex] });
  },
}));
