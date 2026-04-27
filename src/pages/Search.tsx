import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, MapPin, Utensils, LocateFixed } from 'lucide-react';
import { useRestaurantStore } from '../store/useRestaurantStore';
import { mapService } from '../services/mapService';

const Search: React.FC = () => {
  const navigate = useNavigate();
  const { setSearchParams, setIsLoading, setRestaurants, setError, isLoading, error } = useRestaurantStore();
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(500);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lng: number, lat: number} | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // 监听输入并获取建议
  useEffect(() => {
    // 每次重新输入时清除之前的坐标
    setSelectedLocation(null);
    
    if (address.trim().length >= 2) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        try {
          const results = await mapService.getLocationSuggestions(address);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (e) {
          console.error(e);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [address]);

  const handleLocate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { address: currentAddress, lng, lat } = await mapService.getCurrentLocation();
      setAddress(currentAddress);
      setSelectedLocation({ lng, lat });
      setShowSuggestions(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!address.trim() || isLoading) return;
    setShowSuggestions(false);

    setIsLoading(true);
    setError(null);
    try {
      let coords = selectedLocation;
      if (!coords) {
        coords = await mapService.getCoordinates(address);
      }
      
      setSearchParams({ address, radius, coordinates: coords });
      
      const restaurants = await mapService.searchNearbyRestaurants(coords.lng, coords.lat, radius);
      
      if (!restaurants || restaurants.length === 0) {
        throw new Error('该地址附近没有找到餐厅，请换个地址试试');
      }
      
      setRestaurants(restaurants);
      navigate('/restaurants');
    } catch (err: any) {
      setError(err.message || '搜索失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    setAddress(suggestion.name);
    setSelectedLocation({
      lng: suggestion.location.lng,
      lat: suggestion.location.lat
    });
    setShowSuggestions(false);
  };

  return (
    <div className="flex flex-col items-center px-6 pt-16 pb-10 h-full relative bg-[#0B0B0B] text-white overflow-hidden">
      {/* 图片背景装饰 */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ zIndex: 0 }}>
        <div 
          className="absolute top-0 left-0 w-full h-full bg-no-repeat bg-top bg-cover"
          style={{ backgroundImage: 'url("https://tse3-mm.cn.bing.net/th/id/OIP-C.P47g0K-E1pU0rR_o6a6XQAAAAA?rs=1&pid=ImgDetMain")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0B]/40 via-[#0B0B0B]/80 to-[#0B0B0B]" />
      </div>

      {/* 动态气泡食物装饰 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        <div className="absolute top-[10%] left-[10%] animate-float-bubble">
          <span className="text-4xl drop-shadow-md">🍔</span>
        </div>
        <div className="absolute top-[5%] right-[15%] animate-float-bubble-delay-1">
          <span className="text-3xl drop-shadow-md">🍦</span>
        </div>
        <div className="absolute top-[20%] right-[5%] animate-float-bubble-delay-3">
          <span className="text-3xl drop-shadow-md">🍰</span>
        </div>
        <div className="absolute top-[35%] left-[5%] animate-float-bubble-delay-4">
          <span className="text-4xl drop-shadow-md">🍢</span>
        </div>
        <div className="absolute top-[38%] right-[20%] animate-float-bubble-delay-5">
          <span className="text-4xl drop-shadow-md">🍕</span>
        </div>
      </div>

      <div className="mb-10 text-center relative z-20 mt-16">
        <h1 className="text-5xl font-black text-[#FFC300] uppercase tracking-wide drop-shadow-[0_0_15px_rgba(255,195,0,0.5)] mb-3">等会吃什么？</h1>
        <p className="text-zinc-300 font-bold uppercase tracking-widest text-xs drop-shadow-md">WHERE FLAVOR HITS THE ROAD</p>
      </div>

      <form onSubmit={handleSearch} className="w-full space-y-6 relative z-20">
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
          <input
            type="text"
            placeholder="请输入位置或小区、商场名"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={() => address.trim().length >= 2 && setShowSuggestions(true)}
            disabled={isLoading}
            className="w-full pl-12 pr-12 py-4 bg-zinc-900 text-white border border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FFC300] focus:border-transparent transition-all disabled:opacity-50 placeholder:text-zinc-600"
          />
          <button 
            type="button"
            onClick={handleLocate}
            disabled={isLoading}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#FFC300] hover:text-[#e6b000] transition-colors disabled:opacity-50"
            title="获取当前位置"
          >
            <LocateFixed className="w-5 h-5" />
          </button>

          {/* 实时地址建议列表 */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-64 overflow-y-auto z-50">
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSuggestionClick(s)}
                  className="flex flex-col p-3 hover:bg-zinc-800 cursor-pointer transition-colors border-b border-zinc-800 last:border-0"
                >
                  <div className="font-bold text-white truncate">{s.name}</div>
                  <div className="text-xs text-zinc-500 truncate mt-0.5">
                    {s.district} {s.address && typeof s.address === 'string' ? s.address : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-zinc-400 ml-1 uppercase tracking-wider">搜索范围</label>
          <div className="flex gap-3">
            {[500, 1000, 5000].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadius(r)}
                disabled={isLoading}
                className={`flex-1 py-3 rounded-xl border-2 transition-all font-black text-sm sm:text-base ${
                  radius === r
                    ? 'border-[#FFC300] bg-[#FFC300]/10 text-[#FFC300]'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'
                } disabled:opacity-50`}
              >
                {r}m
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-900/50 text-red-400 p-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !address.trim()}
          className="w-full bg-[#FFC300] hover:bg-[#e6b000] disabled:bg-zinc-800 disabled:text-zinc-600 text-black py-4 rounded-2xl font-black text-xl shadow-[0_0_20px_rgba(255,195,0,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wide mt-4"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <SearchIcon className="w-6 h-6" />
              立即找吃的
            </>
          )}
        </button>
      </form>

      <div className="mt-auto text-center text-zinc-600 text-xs py-4 uppercase tracking-widest font-bold">
        Powered by AMap API
      </div>
      
      {/* 点击外部关闭建议列表 */}
      {showSuggestions && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};

export default Search;
