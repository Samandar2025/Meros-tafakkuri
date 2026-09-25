import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const analyzePerformance = async (data: any[]) => {
  const prompt = `Siz milliy ta'lim va ma'naviy qadriyatlar ekotizimining professional pedagogik tahlilchisisiz. Quyidagi o'quvchi ko'rsatkichlarini BO'LIMLAR KESIMIDA ("Meros izidan", "Men qanday yo‘l tutaman?", "Ezgu ishlarim", "O‘zimga nazar", "Amaliy topshiriqlar") chuqur tahlil qiling:
  Ma'lumotlar: ${JSON.stringify(data)}
  
  Vazifa:
  1. Har bir bo'lim bo'yicha oxirgi oylardagi dinamika va o'sish trendini baholang.
  2. O'quvchining qaysi bo'limda (masalan, matn tahlili, ma'naviy tanlov yoki amaliy ezgu ishlarda) eng yuqori natija ko'rsatayotganini va qaysi bo'limga ko'proq e'tibor qaratish kerakligini ko'rsating.
  3. Kelgusi oylik natijadorlik bo'yicha aniq bashorat bering.
  4. O'qituvchi va ota-ona uchun bo'limlar kesimida 2 ta aniq, amaliy pedagogik tavsiya bering.
  
  Javobni o'zbek tilida, professional, samimiy va pedagogik dalillarga asoslangan holda bering.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
};

export const analyzeEQ = async (notes: any[]) => {
  const prompt = `Siz psixolog va emotsional intellekt bo'yicha mutaxassissiz. O'qituvchining o'quvchi haqidagi qaydlarini tahlil qiling:
  Qaydlar: ${JSON.stringify(notes)}
  
  Vazifa:
  1. O'quvchining umumiy emotsional holatini baholang.
  2. Ota-onaga uyda qanday muhit yaratish bo'yicha 3 ta ilmiy tavsiya bering.
  3. O'quvchi bilan qaysi mavzularda suhbatlashish kerakligini ayting.
  
  Javobni o'zbek tilida, iliq va qo'llab-quvvatlovchi ohangda bering.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
};

export const mediateChat = async (messages: any[]) => {
  const prompt = `Siz diplomatik mediator va muloqot bo'yicha mutaxassissiz. Ota-ona va o'qituvchi o'rtasidagi yozishmani tahlil qiling:
  Xabarlar: ${JSON.stringify(messages)}
  
  Vazifa:
  1. Muloqot ohangini aniqlang (ijobiy, neytral, agressiv).
  2. Agar tushunmovchilik bo'lsa, uni yumshatish uchun har ikki tomonga diplomatik maslahat bering.
  3. Konstruktiv muloqotni davom ettirish uchun tayyor iboralarni taklif qiling.
  
  Javobni o'zbek tilida, juda xushmuomala va xolis ohangda bering.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
};

export const suggestCareerPath = async (interests: string[]) => {
  const prompt = `An o'quvchi is interested in: ${interests.join(", ")}.
  Suggest 3 relevant international courses, olympiads, or grants.
  Return as a JSON array of objects with 'title', 'type', and 'description'.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["title", "type", "description"],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]");
};
