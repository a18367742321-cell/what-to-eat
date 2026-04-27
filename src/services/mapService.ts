import { Restaurant } from '../types';

declare const AMap: any;

const waitForAMap = async () => {
  return new Promise<void>((resolve, reject) => {
    // 检查 AMap 以及需要的插件是否已经加载
    if (typeof AMap !== 'undefined' && AMap.Geocoder && AMap.PlaceSearch && AMap.AutoComplete && AMap.Geolocation) {
      resolve();
      return;
    }
    
    let retries = 0;
    const checkAMap = setInterval(() => {
      if (typeof AMap !== 'undefined' && AMap.Geocoder && AMap.PlaceSearch && AMap.AutoComplete && AMap.Geolocation) {
        clearInterval(checkAMap);
        resolve();
      }
      retries++;
      if (retries > 50) { // 5秒超时
        clearInterval(checkAMap);
        reject(new Error('地图服务加载失败，请刷新页面重试'));
      }
    }, 100);
  });
};

export const mapService = {
  async getCoordinates(address: string): Promise<{ lng: number, lat: number }> {
    await waitForAMap();
    return new Promise((resolve, reject) => {
      // 先尝试用地点搜索 (因为像"万达广场"这种是个地点，不是一个行政地址)
      const placeSearch = new AMap.PlaceSearch({
        city: '全国', // 可以在全国范围内搜索
        pageSize: 1,
        pageIndex: 1,
      });

      placeSearch.search(address, (status: string, result: any) => {
        if (status === 'complete' && result.poiList && result.poiList.pois && result.poiList.pois.length > 0) {
          const location = result.poiList.pois[0].location;
          resolve({ lng: location.lng, lat: location.lat });
        } else {
          // 如果地点搜索不到，退回到地理编码搜索 (兜底行政地址，比如"北京市朝阳区")
          const geocoder = new AMap.Geocoder();
          geocoder.getLocation(address, (geoStatus: string, geoResult: any) => {
            if (geoStatus === 'complete' && geoResult.geocodes.length > 0) {
              const location = geoResult.geocodes[0].location;
              resolve({ lng: location.lng, lat: location.lat });
            } else {
              reject(new Error('无法找到该地点，请尝试输入更详细的地址或名称'));
            }
          });
        }
      });
    });
  },

  async searchNearbyRestaurants(lng: number, lat: number, radius: number): Promise<Restaurant[]> {
    await waitForAMap();
    return new Promise(async (resolve, reject) => {
      const center = [lng, lat];

      const fetchCategory = async (type: string, tabId: 'restaurant' | 'teatime'): Promise<Restaurant[]> => {
        const placeSearch = new AMap.PlaceSearch({
          type: type,
          pageSize: 50,
          pageIndex: 1,
          extensions: 'all'
        });

        const fetchPage = (pageIndex: number): Promise<any> => {
          return new Promise((res, rej) => {
            placeSearch.setPageIndex(pageIndex);
            placeSearch.searchNearBy('', center, radius, (status: string, result: any) => {
              if (status === 'complete' && result.poiList) {
                res(result.poiList);
              } else if (status === 'no_data') {
                res({ pois: [], count: 0 });
              } else {
                rej(new Error('搜索附近餐厅失败，请检查网络或稍后重试'));
              }
            });
          });
        };

        const processPois = (pois: any[]) => {
          return pois.map((poi: any) => {
            let photos: string[] = [];
            if (Array.isArray(poi.photos)) {
              photos = poi.photos.map((p: any) => typeof p === 'string' ? p : p.url).filter(Boolean);
            } else if (poi.deep_info && Array.isArray(poi.deep_info.photos)) {
              photos = poi.deep_info.photos.map((p: any) => typeof p === 'string' ? p : p.url).filter(Boolean);
            }
            
            if (photos.length === 0) {
              const poiType = poi.type || '';
              if (poiType.includes('火锅')) {
                photos = ['https://images.unsplash.com/photo-1582878826629-29b7ad1cb431?q=80&w=400&auto=format&fit=crop'];
              } else if (poiType.includes('烧烤')) {
                photos = ['https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400&auto=format&fit=crop'];
              } else if (poiType.includes('日韩') || poiType.includes('日料')) {
                photos = ['https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=400&auto=format&fit=crop'];
              } else if (poiType.includes('西餐')) {
                photos = ['https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=400&auto=format&fit=crop'];
              } else if (poiType.includes('快餐') || poiType.includes('汉堡')) {
                photos = ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop'];
              } else if (poiType.includes('甜品') || poiType.includes('奶茶')) {
                photos = ['https://images.unsplash.com/photo-1551024506-0cb4a161728e?q=80&w=400&auto=format&fit=crop'];
              } else if (poiType.includes('咖啡')) {
                photos = ['https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=400&auto=format&fit=crop'];
              } else {
                const defaultImages = [
                  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=400&auto=format&fit=crop',
                  'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400&auto=format&fit=crop',
                  'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=400&auto=format&fit=crop'
                ];
                const index = poi.id ? parseInt(poi.id.substring(poi.id.length - 2), 16) % defaultImages.length : 0;
                photos = [defaultImages[index]];
              }
            }

            return {
              id: poi.id,
              name: poi.name,
              address: poi.address || (poi.adname ? poi.adname + poi.address : '暂无详细地址'),
              location: {
                lng: poi.location.lng,
                lat: poi.location.lat,
              },
              distance: Number(poi.distance) || 0,
              rating: poi.biz_ext?.rating ? Number(poi.biz_ext.rating) : Number((Math.random() * 1.5 + 3.5).toFixed(1)),
              phone: poi.tel || '暂无电话',
              category: poi.type ? poi.type.split(';')[poi.type.split(';').length - 1] : '餐饮',
              photos: photos,
              tabId: tabId,
            };
          });
        };

        try {
          const firstPage = await fetchPage(1);
          if (!firstPage || firstPage.count === 0) return [];

          let categoryRestaurants = processPois(firstPage.pois);
          const totalPages = Math.min(4, Math.ceil(firstPage.count / 50)); // 拉取4页，最多200个

          if (totalPages > 1) {
            // 必须串行拉取，因为 placeSearch.setPageIndex 会改变实例状态
            for (let i = 2; i <= totalPages; i++) {
              try {
                const page = await fetchPage(i);
                if (page && page.pois) {
                  categoryRestaurants = categoryRestaurants.concat(processPois(page.pois));
                }
              } catch (e) {
                console.error(`Fetch page ${i} failed`, e);
              }
            }
          }
          return categoryRestaurants;
        } catch (e) {
          console.error(e);
          return [];
        }
      };

      try {
        // 串行拉取不同分类，避免高德 API 的并发限制或回调覆盖问题
        // 正餐：050100(中餐厅), 050200(外国餐厅), 050300(快餐厅)
        const meals = await fetchCategory('050100|050200|050300', 'restaurant');
        
        // 下午茶：050400(休闲餐饮场所 - 往往包含轻食/下午茶), 050500(咖啡厅), 050600(茶座), 050700(冷饮店), 050800(糕点店), 050900(甜品店)
        const teatimes = await fetchCategory('050400|050500|050600|050700|050800|050900', 'teatime');
        
        resolve([...meals, ...teatimes]);
      } catch (error) {
        reject(error);
      }
    });
  },

  async searchByKeyword(keyword: string): Promise<Restaurant[]> {
    if (!keyword || keyword.trim().length < 2) return [];
    await waitForAMap();
    
    return new Promise((resolve) => {
      const placeSearch = new AMap.PlaceSearch({
        type: '餐饮服务',
        pageSize: 5,
        pageIndex: 1,
        extensions: 'all'
      });

      placeSearch.search(keyword, (status: string, result: any) => {
        if (status === 'complete' && result.poiList && result.poiList.pois) {
          const pois = result.poiList.pois;
          const restaurants = pois.map((poi: any) => {
            let photos: string[] = [];
            if (Array.isArray(poi.photos)) {
              photos = poi.photos.map((p: any) => typeof p === 'string' ? p : p.url).filter(Boolean);
            }
            
            if (photos.length === 0) {
              const defaultImages = [
                'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=100&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=100&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=100&auto=format&fit=crop'
              ];
              const index = poi.id ? parseInt(poi.id.substring(poi.id.length - 2), 16) % defaultImages.length : 0;
              photos = [defaultImages[index]];
            }

            return {
              id: poi.id,
              name: poi.name,
              address: poi.address || (poi.adname ? poi.adname + poi.address : '暂无详细地址'),
              location: {
                lng: poi.location.lng,
                lat: poi.location.lat,
              },
              distance: Number(poi.distance) || 0,
              rating: poi.biz_ext?.rating ? Number(poi.biz_ext.rating) : Number((Math.random() * 1.5 + 3.5).toFixed(1)),
              phone: poi.tel || '暂无电话',
              category: poi.type ? poi.type.split(';')[poi.type.split(';').length - 1] : '餐饮',
              typecode: poi.typecode,
              fullType: poi.type,
              photos: photos,
            };
          });
          resolve(restaurants);
        } else {
          resolve([]);
        }
      });
    });
  },

  async getLocationSuggestions(keyword: string): Promise<any[]> {
    if (!keyword || keyword.trim().length < 2) return [];
    await waitForAMap();
    
    return new Promise((resolve) => {
      const autoComplete = new AMap.AutoComplete({ city: '全国' });
      autoComplete.search(keyword, (status: string, result: any) => {
        if (status === 'complete' && result.tips) {
          // 过滤掉没有具体坐标的泛泛建议
          resolve(result.tips.filter((t: any) => t.id && t.location));
        } else {
          resolve([]);
        }
      });
    });
  },

  async getCurrentLocation(): Promise<{ address: string, lng: number, lat: number }> {
    await waitForAMap();
    return new Promise((resolve, reject) => {
      const geolocation = new AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        needAddress: true,
      });
      
      geolocation.getCurrentPosition((status: string, result: any) => {
        if (status === 'complete') {
          resolve({
            address: result.formattedAddress || '当前位置',
            lng: result.position.lng,
            lat: result.position.lat
          });
        } else {
          reject(new Error('定位失败，请检查设备定位权限'));
        }
      });
    });
  }
};
