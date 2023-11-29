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

  // The question mark is the optional chaining operator. If route is null, then
  // the expression will evaluate to null.
  return route?.path
}

export { useCurrentPath, routes }