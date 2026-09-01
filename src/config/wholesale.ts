export const HOT_KEYWORDS = [
  // Blonde Amber
  "בלונד אמבר",
  "blonde amber",
  
  // Ex Nihilo
  "אקס נילו",
  "ex nihilo",
  
  // Ormonde Jayne
  "הורמון גאבה",
  "אורמונד ג'יין",
  "ormonde jayne",
  
  // Amouage & Outlands
  "אמואג׳",
  "amouage",
  "outlands",
  
  // By Kilian
  "ביי קיליאן",
  "קיליאן",
  "by kilian",
  "kilian",
  
  // Essential Parfums (Bois Imperial)
  "אסנשייל פרפיומס",
  "אסנשייל פרפיומס בויס",
  "בויס אימפריאל",
  "essential parfums",
  "bois imperial",
  
  // Spirit of Dubai
  "ספיריט אוף דובאי",
  "spirit of dubai",
  
  // Memo Cap Camarat
  "ממו קאפ קמראט",
  "memo cap camarat",
  
  // Roja
  "רוז'ה",
  "רוז׳ה",
  "roja",
  
  // Parfums de Marly - Valaya
  "פרפום דה מארלי",
  "פרפיום דה מארלי",
  "parfums de marly",
  "valya",
  "valaya",
  "ואליה",
  "וואליה",
  
  // Jeroboam - Gozo
  "גוזו",
  "gozo",
  "jeroboam",
  "ג'רובום",

  // Maison Crivelli - Hibiscus Mahajad
  "מייסון קריבלי",
  "maison crivelli",
  "היביסקוס",
  "היביסקוס מהג'אד",
  "hibiscus",
  "hibiscus mahajád",
  "hibiscus mahajad"
];

export function isHotProduct(brand: string | null, name: string | null): boolean {
  const b = (brand || "").toLowerCase();
  const n = (name || "").toLowerCase();
  return HOT_KEYWORDS.some(
    (kw) => b.includes(kw.toLowerCase()) || n.includes(kw.toLowerCase())
  );
}
