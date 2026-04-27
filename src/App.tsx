import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Search from "@/pages/Search";
import RestaurantList from "@/pages/RestaurantList";
import RestaurantDetail from "@/pages/RestaurantDetail";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-[#FFC300]/30">
        <div className="max-w-md mx-auto min-h-screen bg-[#0B0B0B] shadow-2xl relative overflow-x-hidden border-x border-zinc-900/50">
          <Routes>
            <Route path="/" element={<Search />} />
            <Route path="/restaurants" element={<RestaurantList />} />
            <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
