import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "./api";

const SiteContentContext = createContext({ content: null, refresh: () => {} });
export const useSiteContent = () => useContext(SiteContentContext);

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(null);
  const refresh = useCallback(() => {
    return api.get("/public/site-content").then((r) => setContent(r.data)).catch(() => setContent({ settings: {}, heroSlides: [], testimonials: [], trustPillars: [], propertyTypes: [] }));
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return <SiteContentContext.Provider value={{ content, refresh }}>{children}</SiteContentContext.Provider>;
}
