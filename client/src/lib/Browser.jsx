import { useMemo } from "react";
import { matchRoutes, useLocation } from "react-router-dom";
import  HomePage from "src/pages/HomePage";
import RecipeGalleryPage from "src/pages/RecipeGalleryPage";
import RecipeDetailPage from "src/pages/RecipeDetailPage";

const routes = [
    {
      path: "/",
      navigationText: "Home",
      element: <HomePage />
    },

    {
      path: "/recipe-gallery",
      navigationText: "Recipe Gallery",
      element: <RecipeGalleryPage />
    },

    {
      path: "/recipe/:name",
      element: <RecipeDetailPage />
    }
];

const useCurrentPath = () => {
  const location = useLocation();
  const [{ route }] = matchRoutes(routes, location) || [{route: null}];

  // The question mark is the optional chaining operator. If route is null, then
  // the expression will evaluate to null.
  return route?.path
}

function useQuery() {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search), [location]);
}

export { useCurrentPath, useQuery, routes }