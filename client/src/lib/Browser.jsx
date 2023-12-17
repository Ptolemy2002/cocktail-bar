import { useMemo } from "react";
import { matchRoutes, useLocation } from "react-router-dom";
import  HomePage from "src/pages/HomePage";
import RecipeGalleryPage from "src/pages/RecipeGalleryPage";
import RecipeDetailPage from "src/pages/RecipeDetailPage";
import IngredientGalleryPage from "src/pages/IngredientGalleryPage";

export const routes = [
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
      path: "/ingredient-gallery",
      navigationText: "Ingredient Gallery",
      element: <IngredientGalleryPage />
    },

    {
      path: "/recipe/:name",
      element: <RecipeDetailPage />
    }
];

export const useCurrentPath = () => {
  const location = useLocation();
  const [{ route }] = matchRoutes(routes, location) || [{route: null}];

  // The question mark is the optional chaining operator. If route is null, then
  // the expression will evaluate to null.
  return route?.path
}

export function useQuery() {
  const location = useLocation();
  return useMemo(() => new URLSearchParams(location.search), [location]);
}