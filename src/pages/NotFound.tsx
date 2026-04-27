
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-blox-gradient flex items-center justify-center">
      <div className="text-center blox-card p-12">
        <h1 className="text-6xl font-bold mb-4 text-blox-teal">404</h1>
        <p className="text-xl text-gray-300 mb-8">Oops! Page not found</p>
        <Link to="/" className="blox-button inline-flex">
          <Home size={18} /> Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
