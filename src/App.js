import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginScreen from "./components/LoginScreen";
import MainMenu from "./components/MainMenu";
import CookMode from "./components/CookMode";
import RecipeLibrary from "./components/RecipeLibrary";
import UserProfile from "./components/UserProfile";
import FeedScreen from "./components/FeedScreen";
import { useLocation } from "react-router-dom";

const App = () => {
  return (
    <Router>
      {/* Contenedor principal que asegura el formato vertical para móviles */}
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/menu" element={<MainMenu />} />
          <Route path="/cook-mode" element={<CookModeWrapper />} />
          <Route path="/recipes" element={<RecipeLibrary />} />
          <Route path="/feed" element={<FeedScreen />} />{" "}
          {/* Nueva ruta para el feed */}
          <Route
            path="/settings"
            element={
              <div className="min-h-screen bg-gradient-to-br from-gray-400 to-slate-500 flex items-center justify-center">
                <h1 className="text-4xl font-bold text-white">
                  Configuración - Próximamente
                </h1>
              </div>
            }
          />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
      </div>
    </Router>
  );
};

// Wrapper component to pass recipe data to CookMode
const CookModeWrapper = () => {
  const location = useLocation();
  const { recipe } = location.state || {};

  if (!recipe) {
    // Redirect if no recipe is provided, or show an error
    return <Navigate to="/recipes" replace />;
  }

  return <CookMode recipe={recipe} />;
};

export default App;
