import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Phone, MapPin, Navigation, Clock, Star, Utensils } from 'lucide-react';
import { useRestaurantStore } from '../store/useRestaurantStore';

const RestaurantDetail: React.FC = () => {
  const navigate = useNavigate();
  const { selectedRestaurant } = useRestaurantStore();

  if (!selectedRestaurant) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-6 text-center">
        <h2 className="text-xl font-bold text-zinc-800 mb-4">未找到餐厅信息</h2>
        <button
          onClick={() => navigate('/restaurants')}
          className="bg-orange-500 text-white px-8 py-3 rounded-xl font-medium"
        >
          返回列表
        </button>
      </div>
    );
  }

  const handleNavigate = () => {
    const { lng, lat } = selectedRestaurant.location;
    const url = `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(selectedRestaurant.name)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Cover Image Placeholder */}
      <div className="h-64 bg-zinc-100 relative overflow-hidden">
        {selectedRestaurant.photos && selectedRestaurant.photos.length > 0 ? (
          <img 
            src={selectedRestaurant.photos[0]} 
            alt={selectedRestaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-orange-50">
            <Utensils className="w-16 h-16 text-orange-200" />
          </div>
        )}
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-6 left-6 p-2 bg-white/80 backdrop-blur shadow-md rounded-full text-zinc-800"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 px-6 pt-6 pb-10 space-y-8 overflow-y-auto">
        {/* Basic Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded uppercase tracking-wider">
              {selectedRestaurant.category.split(';')[0]}
            </span>
            <div className="flex items-center gap-1 ml-auto">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-zinc-800">{selectedRestaurant.rating || '暂无评分'}</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 leading-tight">{selectedRestaurant.name}</h1>
          <p className="text-zinc-500 flex items-center gap-1 text-sm">
            <MapPin className="w-3 h-3" />
            距离您约 {selectedRestaurant.distance} 米
          </p>
        </div>

        {/* Detailed Info */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-zinc-50 p-3 rounded-xl">
              <MapPin className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-800">详细地址</p>
              <p className="text-sm text-zinc-500 leading-relaxed">{selectedRestaurant.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-zinc-50 p-3 rounded-xl">
              <Phone className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-800">联系电话</p>
              <p className="text-sm text-zinc-500">{selectedRestaurant.phone || '暂无电话信息'}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-zinc-50 p-3 rounded-xl">
              <Clock className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-800">营业时间</p>
              <p className="text-sm text-zinc-500">{selectedRestaurant.openHours || '暂未提供营业时间'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-6 border-t border-zinc-100">
        <button
          onClick={handleNavigate}
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Navigation className="w-5 h-5" />
          开始导航
        </button>
      </div>
    </div>
  );
};

export default RestaurantDetail;
