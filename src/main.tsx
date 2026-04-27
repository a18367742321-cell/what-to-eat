import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// 配置高德地图安全密钥
if (import.meta.env.VITE_AMAP_SECURITY_KEY) {
  (window as any)._AMapSecurityConfig = {
    securityJsCode: import.meta.env.VITE_AMAP_SECURITY_KEY,
  };
}

// 动态加载高德地图脚本
const loadAMapScript = () => {
  const script = document.createElement('script');
  // 添加插件 AMap.AutoComplete 和 AMap.Geolocation
  script.src = `https://webapi.amap.com/maps?v=2.0&key=${import.meta.env.VITE_AMAP_KEY}&plugin=AMap.Geocoder,AMap.PlaceSearch,AMap.AutoComplete,AMap.Geolocation`;
  script.type = 'text/javascript';
  document.head.appendChild(script);
};

if (import.meta.env.VITE_AMAP_KEY) {
  loadAMapScript();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
