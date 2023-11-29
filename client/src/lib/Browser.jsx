import { matchRoutes, useLocation } from "react-router-dom";
import  HomePage from "src/pages/HomePage";
import GalleryPage from "src/pages/GalleryPage";

const routes = [
    {
      path: "/",
      navigationText: "Home",
      element: <HomePage />
    },

    {
      path: "/gallery",
      navigationText: "Gallery",
      element: <GalleryPage />
    }
];

const useCurrentPath = () => {
  const location = useLocation();
  const [{ route }] = matchRoutes(routes, location) || [{route: null}];

  return route?.path
}

export { useCurrentPath, routes }