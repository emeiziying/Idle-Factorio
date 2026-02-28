import zhCatalog from '@/data/spa/i18n/zh.json';

interface CatalogI18nData {
  categories?: Record<string, string>;
  items?: Record<string, string>;
  recipes?: Record<string, string>;
  locations?: Record<string, string>;
  technologies?: Record<string, string>;
}

const localizedCatalog = zhCatalog as CatalogI18nData;

const getLocalizedValue = (
  dictionary: Record<string, string> | undefined,
  id: string
): string | undefined => {
  return dictionary?.[id];
};

export const getLocalizedCatalogItemName = (itemId: string): string | undefined => {
  return getLocalizedValue(localizedCatalog.items, itemId);
};

export const getLocalizedCatalogRecipeName = (recipeId: string): string | undefined => {
  return getLocalizedValue(localizedCatalog.recipes, recipeId);
};

export const getLocalizedCatalogTechnologyName = (technologyId: string): string | undefined => {
  return (
    getLocalizedValue(localizedCatalog.technologies, technologyId) ||
    getLocalizedValue(localizedCatalog.items, technologyId) ||
    getLocalizedValue(localizedCatalog.recipes, technologyId)
  );
};
