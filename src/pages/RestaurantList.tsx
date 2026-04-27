import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Dice5, Star, MapPin, RefreshCcw, Loader2, Utensils, Coffee, Navigation, X } from 'lucide-react';
import { useRestaurantStore } from '../store/useRestaurantStore';
import { Restaurant } from '../types';

const TABS = [
  { id: 'restaurant', label: '正餐饱腹', icon: Utensils },
  { id: 'teatime', label: '下午茶', icon: Coffee }, // 合并奶茶和甜品
] as const;

type TabId = typeof TABS[number]['id'];

const RestaurantList: React.FC = () => {
  const navigate = useNavigate();
  const { 
    restaurants, 
    isLoading, 
    error, 
    randomSelect, 
    selectedRestaurant, 
    setSelectedRestaurant,
    searchParams 
  } = useRestaurantStore();
  
  const [isRolling, setIsRolling] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('restaurant');
  const [showResultModal, setShowResultModal] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // 每次切换Tab时，让列表滚动回顶部，产生明确的“刷新”感
  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  // 根据 tabId 直接过滤，同时在前端加一层严格判定以兜底高德API分类不严谨的情况
  const filteredRestaurants = useMemo(() => {
    let list = restaurants.filter(r => r.tabId === activeTab);
    
    // 强力兜底词库过滤
    list = list.filter(r => {
      const name = r.name || '';
      const fullType = r.fullType || '';
      const category = r.category || '';
      
      const teatimeKeywords = ['奶茶', '咖啡', '甜品', '糕点', '蛋糕', '面包', '烘焙', '冰品', '甜点', '茶饮', '奶昔', '冰淇淋', '雪糕', '冰雪', '鲜芋仙', '喜茶', '蜜雪冰城', '奈雪', '星巴克', '瑞幸', '库迪', '霸王茶姬', '茶百道', '一点点', '古茗', '沪上阿姨', '好利来', '鲍师傅', '茶颜悦色', '饮品', '下午茶'];
      
      const isTeatimeStore = teatimeKeywords.some(keyword => name.includes(keyword) || fullType.includes(keyword) || category.includes(keyword));
      
      if (activeTab === 'restaurant') {
        // 在“正餐饱腹”中，如果商户名或分类命中了下午茶特征，坚决剔除
        return !isTeatimeStore;
      } else {
        // 在“下午茶”中，如果商户名包含快餐/正餐特征词，且不包含任何下午茶特征，则坚决剔除（防止“休闲餐饮”混入奇怪的店）
        const mealKeywords = ['火锅', '烧烤', '烤肉', '麻辣烫', '串串香', '冒菜', '海鲜', '炒菜', '家常菜', '面馆', '粉店', '米线', '饺子', '快餐', '汉堡', '披萨', '日料', '寿司', '牛排', '炸鸡', '烤鱼', '烤串', '盖饭', '盒饭', '大排档'];
        const isMealStore = mealKeywords.some(keyword => name.includes(keyword) || fullType.includes(keyword) || category.includes(keyword));
        
        if (isMealStore && !isTeatimeStore) {
          return false;
        }
        return true;
      }
    });

    // 强制去重，防止高德 API 分页数据中存在重复项导致 React 渲染错乱
    const uniqueMap = new Map();
    list.forEach(r => {
      if (!uniqueMap.has(r.id)) {
        uniqueMap.set(r.id, r);
      }
    });
    return Array.from(uniqueMap.values());
  }, [restaurants, activeTab]);

  const handleRandomSelect = () => {
    if (filteredRestaurants.length === 0) return;
    setIsRolling(true);
    setShowResultModal(true); // 打开摇骰子弹窗

    // 模拟摇筛子滚动效果：每50ms随机抽取一个并显示在弹窗里，持续1.5秒
    let count = 0;
    const interval = setInterval(() => {
      randomSelect(filteredRestaurants);
      count++;
      if (count > 30) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 50);
  };

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const handleNavigate = (e: React.MouseEvent, restaurant: Restaurant | null) => {
    if (e) e.stopPropagation();
    if (!restaurant) return;
    // 使用高德地图网页版导航链接
    const destName = encodeURIComponent(restaurant.name);
    const url = `https://uri.amap.com/navigation?to=${restaurant.location.lng},${restaurant.location.lat},${destName}&mode=walk&policy=1&src=mypage&coordinate=gaode&callnative=1`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0B0B0B]">
        <Loader2 className="w-12 h-12 text-[#FFC300] animate-spin mb-4" />
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">Searching...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-6 text-center bg-[#0B0B0B]">
        <div className="bg-red-950/30 p-4 rounded-full mb-4 border border-red-900/50">
          <RefreshCcw className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-[#FFC300] mb-2 uppercase tracking-wide">出错了</h2>
        <p className="text-zinc-400 mb-8">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-[#FFC300] text-black px-10 py-3.5 rounded-full font-black shadow-[0_0_15px_rgba(255,195,0,0.2)] active:scale-95 transition-transform uppercase tracking-wider text-sm"
        >
          重新搜索
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0B0B0B] text-white">
      {/* Header */}
      <div className="bg-[#0B0B0B]/90 backdrop-blur-md px-4 pt-6 pb-4 flex flex-col border-b border-zinc-900 sticky top-0 z-10">
        <div className="flex items-center mb-5">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 hover:bg-zinc-800 rounded-full transition-colors mr-1">
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-[#FFC300] leading-none uppercase tracking-wide">THE FOODIE WAGON</h2>
            <p className="text-[10px] text-white font-light tracking-widest mt-1 opacity-80">WHERE FLAVOR HITS THE ROAD</p>
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-xs text-zinc-400 flex items-center gap-1 font-bold uppercase tracking-wider">
            <MapPin className="w-3 h-3 text-[#FFC300]" />
            {searchParams.address} · {searchParams.radius}m
          </p>
          <div className="flex items-center gap-1 text-[10px] font-bold bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
            <Star className="w-3 h-3 text-[#FFC300] fill-[#FFC300]" />
            <span>100% REAL</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 overflow-x-auto hide-scrollbar px-1 pb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  // 切换分类时清除选中的餐厅状态，避免上个分类选中的数据污染当前分类
                  setSelectedRestaurant(null);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-[#FFC300] text-black shadow-[0_0_15px_rgba(255,195,0,0.3)] border border-[#FFC300]' 
                    : 'bg-zinc-900 text-white border border-zinc-700 hover:border-zinc-500'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-white'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
              <Utensils className="w-10 h-10 text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-bold uppercase tracking-wider text-sm">NO RESULTS FOUND</p>
            <p className="text-zinc-600 text-xs mt-2 uppercase">换个分类看看吧~</p>
          </div>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              onClick={() => handleRestaurantClick(restaurant)}
              className={`bg-zinc-900 p-3.5 rounded-2xl border transition-all relative overflow-visible ${
                selectedRestaurant?.id === restaurant.id ? 'border-[#FFC300] shadow-[0_0_20px_rgba(255,195,0,0.15)] scale-[1.02]' : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex gap-4">
                <div className="w-28 h-28 rounded-xl overflow-hidden bg-black shrink-0 relative">
                  <img
                    src={restaurant.photos?.[0]}
                    alt={restaurant.name}
                    className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                    loading="lazy"
                  />
                  {selectedRestaurant?.id === restaurant.id && (
                    <div className="absolute inset-0 bg-[#FFC300]/10 backdrop-blur-[1px] flex items-center justify-center">
                      <Star className="w-10 h-10 text-[#FFC300] fill-[#FFC300] drop-shadow-lg animate-pulse" />
                    </div>
                  )}
                  {/* Yellow Price Badge Style -> used for Distance */}
                  <div className="absolute -top-2 -left-2 bg-[#FFC300] text-black text-xs font-black px-2 py-1 rounded-full shadow-lg border-2 border-zinc-900">
                    {restaurant.distance}m
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 py-1 flex flex-col justify-between relative">
                  <div className="flex justify-between items-start">
                    <h3 className="font-black text-white text-lg flex-1 mr-2 leading-tight line-clamp-2 tracking-wide uppercase">{restaurant.name}</h3>
                  </div>
                  
                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                        <div className="flex items-center gap-1 text-[#FFC300]">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="font-bold">{restaurant.rating || 'NEW'}</span>
                        </div>
                        <span className="text-zinc-700">|</span>
                        <span className="truncate font-bold text-zinc-300 text-xs uppercase tracking-wider">{restaurant.category || '餐饮'}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate flex items-center gap-1.5 uppercase tracking-wider">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{restaurant.address}</span>
                      </p>
                    </div>
                    
                    {/* 仅在选中当前餐厅时显示导航按钮 */}
                    {selectedRestaurant?.id === restaurant.id && (
                      <button
                        onClick={(e) => handleNavigate(e, restaurant)}
                        className="bg-[#FFC300] hover:bg-[#e6b000] text-black rounded-full p-3 shadow-[0_0_15px_rgba(255,195,0,0.3)] transition-transform active:scale-90 shrink-0 ml-2 animate-in fade-in zoom-in"
                        title="去这里"
                      >
                        <Navigation className="w-5 h-5 fill-black" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Action */}
      {filteredRestaurants.length > 0 && (
        <div className="bg-[#0B0B0B]/90 backdrop-blur-md p-5 border-t border-zinc-900 pb-8">
          <button
            onClick={handleRandomSelect}
            className={`w-full bg-[#FFC300] hover:bg-[#e6b000] text-black py-4 rounded-full font-black text-lg shadow-[0_0_25px_rgba(255,195,0,0.2)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] uppercase tracking-wide`}
          >
            <Dice5 className="w-6 h-6" />
            {`帮我在【${TABS.find(t => t.id === activeTab)?.label}】选一个`}
          </button>
        </div>
      )}

      {/* 摇骰子弹窗 */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-[0_0_40px_rgba(255,195,0,0.15)] animate-in zoom-in-95 relative">
            {!isRolling && (
              <button 
                onClick={() => setShowResultModal(false)}
                className="absolute right-4 top-4 z-10 bg-black/50 hover:bg-black/80 p-2 rounded-full backdrop-blur-md transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            )}

            {selectedRestaurant && (
              <>
                {/* 顶部图片 */}
                <div className="relative h-64 w-full bg-black">
                  <img 
                    src={selectedRestaurant.photos?.[0]} 
                    alt={selectedRestaurant.name}
                    className={`w-full h-full object-cover transition-opacity duration-200 ${isRolling ? 'opacity-40 grayscale blur-md' : 'opacity-90'}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
                  
                  {/* 状态文字或名称 */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    {isRolling ? (
                      <div className="flex items-center gap-3 text-[#FFC300]">
                        <Dice5 className="w-8 h-8 animate-spin" />
                        <span className="font-black text-2xl animate-pulse uppercase tracking-widest">Picking...</span>
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-3xl font-black text-[#FFC300] leading-tight line-clamp-2 drop-shadow-lg uppercase tracking-wide">
                          {selectedRestaurant.name}
                        </h2>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="bg-[#FFC300] text-black text-xs font-black px-2.5 py-1 rounded shadow-[0_0_10px_rgba(255,195,0,0.3)] flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            {selectedRestaurant.rating || 'NEW'}
                          </span>
                          <span className="text-white/80 text-xs font-bold uppercase tracking-widest">
                            {selectedRestaurant.category || '餐饮'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 详情与操作区 */}
                <div className="p-6 pt-4">
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-full shrink-0">
                        <MapPin className="w-5 h-5 text-[#FFC300]" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white mb-1 uppercase tracking-wide">
                          距离您 <span className="text-[#FFC300] ml-1">{selectedRestaurant.distance}m</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium uppercase tracking-wider">
                          {selectedRestaurant.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 按钮组 */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleRandomSelect}
                      className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
                    >
                      <RefreshCcw className={`w-4 h-4 ${isRolling ? 'animate-spin text-[#FFC300]' : ''}`} />
                      换一家
                    </button>
                    <button
                      onClick={(e) => handleNavigate(e, selectedRestaurant)}
                      disabled={isRolling}
                      className="flex-[2] bg-[#FFC300] hover:bg-[#e6b000] text-black font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(255,195,0,0.2)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale uppercase tracking-wider"
                    >
                      <Navigation className="w-5 h-5 fill-black" />
                      去这里
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantList;
