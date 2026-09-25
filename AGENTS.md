# AI Studio Agent Guidelines & Project Architecture

## Loyiha Tavsifi: Ta'lim Ekotizimi (School Management & AI Ecosystem)
Ushbu loyiha maktab ta'lim jarayonlarini boshqarish, o'quvchilar, ustozlar, ota-onalar va psixologlar o'rtasida samarali hamkorlikni ta'minlash hamda sun'iy intellekt (Gemini) imkoniyatlaridan foydalangan holda o'quvchilar tahlilini yuritishga mo'ljallangan platformadir.

---

## 1. Foydalanuvchi Rollari (Roles)
- **admin**: Tizim administratori. Barcha foydalanuvchilar (ustozlar, ota-onalar, o'quvchilar), jadval, fanlar va tizim sozlamalarini to'liq nazorat qiladi.
- **teacher**: Sinf rahbari / Ustoz. O'quvchilarni boshqaradi, ularga login/parol belgilaydi, amaliy mashqlar yaratadi va baholaydi.
- **student**: O'quvchi. Maxsus login va parol orqali kiradi, fanlar bo'yicha mashqlarni bajaradi, o'z natijalari va ustoz ma'lumotlarini ko'radi, profilidan xavfsiz chiqish (Logout) imkoniga ega.
- **parent**: Ota-ona. O'z farzandining dars jadvali, baholari, AI tahlillari va xabarlarini kuzatadi.
- **psychologist**: Maktab psixologi. O'quvchilarning ruhiy-ijtimoiy holati va xulq-atvorini tahlil qiladi.

---

## 2. Asosiy Modullar va Funksionallik
1. **Mashqlar va Topshiriqlar (Exercises & Submissions):**
   - Fanlar kesimidagi testlar va savollar (`/api/exercises`).
   - O'quvchilar javoblarini tekshirish, ballar va foizlarni hisoblash (`/api/exercises/submit`).
   - O'qituvchi va admin uchun yangi mashqlar qo'shish interfeysi.

2. **O'quvchilar Login va Parol Boshqaruvi:**
   - O'quvchi qo'shilayotganda yoki mavjud o'quvchilar kartochkasidan to'g'ridan-to'g'ri login va parol biriktirish (`/api/students/:id/credentials`).
   - O'quvchilar uchun avtomatik login/parol generatsiyasi.

3. **Xavfsiz Tizimdan Chiqish (Logout):**
   - O'quvchi, ustoz, ota-ona va admin profillarida mustaqil tizimdan chiqish tugmasi (`LogOut`).
   - O'quvchi profil sahifasida hamda asosiy Dashboard panelida tezkor chiqish imkoniyati.

4. **Sun'iy Intellekt (Gemini) Integratsiyasi:**
   - O'quvchining akademik ko'rsatkichlari, emotsional intellekti (EQ) va darslardagi faolligi asosida shaxsiy tahlil.
   - O'quvchining qiziqishlariga mos keluvchi kelajak kasblari tavsiyasi (Career Guidance).
   - Ota-ona va o'qituvchi o'rtasidagi muloqotni yumshatuvchi va to'g'ri yo'naltiruvchi AI vositachilik yordami.

---

## 3. Kod Standartlari va Konventsiyalar
- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide React (ikonlar), Framer Motion (`motion/react`), Recharts (diagrammalar).
- **Backend:** Express.js, TypeScript (`tsx` orqali dev, `esbuild` bilan cjs bundle).
- **Til:** O'zbek tili (Lotin alifbosida). Interfeys sodda, tushunarli va qulay bo'lishi shart.
- **Xavfsizlik:** Barcha ma'lumotlar saqlanishi va sessiya to'g'ri boshqarilishi lozim.
