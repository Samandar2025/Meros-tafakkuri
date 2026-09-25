import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("edusync.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK(role IN ('admin', 'teacher', 'parent', 'psychologist')) NOT NULL,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER,
    teacher_id INTEGER,
    username TEXT UNIQUE,
    password TEXT,
    user_id INTEGER,
    FOREIGN KEY(parent_id) REFERENCES users(id),
    FOREIGN KEY(teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS eq_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    teacher_id INTEGER,
    note TEXT NOT NULL,
    mood TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id),
    FOREIGN KEY(teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS performance_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    subject TEXT NOT NULL,
    score INTEGER,
    attendance_rate REAL,
    activity_level REAL,
    month TEXT NOT NULL,
    FOREIGN KEY(student_id) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS weekly_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT NOT NULL,
    time TEXT NOT NULL,
    subject TEXT NOT NULL,
    teacher_id INTEGER,
    FOREIGN KEY(teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'O''rta',
    points INTEGER DEFAULT 10,
    questions TEXT NOT NULL,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS student_exercise_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id),
    FOREIGN KEY(exercise_id) REFERENCES exercises(id)
  );

  CREATE TABLE IF NOT EXISTS heritage_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    connection TEXT,
    values_direction TEXT,
    questions TEXT,
    author_or_source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS heritage_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    material_id INTEGER NOT NULL,
    answers TEXT NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id),
    FOREIGN KEY(material_id) REFERENCES heritage_materials(id)
  );

  CREATE TABLE IF NOT EXISTS moral_situations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    situation_text TEXT NOT NULL,
    options TEXT NOT NULL,
    values_direction TEXT DEFAULT '',
    reason_prompt TEXT DEFAULT '',
    consequence_prompt TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS moral_choices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    situation_id INTEGER NOT NULL,
    selected_option_id INTEGER NOT NULL,
    selected_option_text TEXT NOT NULL,
    reason TEXT NOT NULL,
    expected_consequence TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id),
    FOREIGN KEY(situation_id) REFERENCES moral_situations(id)
  );

  CREATE TABLE IF NOT EXISTS good_deeds_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    value_name TEXT DEFAULT '',
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS good_deeds_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    task_id INTEGER,
    what_done TEXT NOT NULL,
    with_whom TEXT NOT NULL,
    result_impact TEXT NOT NULL,
    status TEXT DEFAULT 'submitted',
    teacher_verified INTEGER DEFAULT 0,
    teacher_feedback TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id),
    FOREIGN KEY(task_id) REFERENCES good_deeds_tasks(id)
  );
`);

// Migration to ensure heritage_materials has connection, values_direction, questions
try { db.exec("ALTER TABLE heritage_materials ADD COLUMN connection TEXT;"); } catch {}
try { db.exec("ALTER TABLE heritage_materials ADD COLUMN values_direction TEXT;"); } catch {}
try { db.exec("ALTER TABLE heritage_materials ADD COLUMN questions TEXT;"); } catch {}

// Migration to ensure users table has 'admin' and 'student' in role check constraint
try {
  const tableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get() as any;
  if (tableSql && tableSql.sql && (!tableSql.sql.includes("'admin'") || !tableSql.sql.includes("'student'"))) {
    db.pragma("foreign_keys = OFF");
    db.exec(`
      CREATE TABLE users_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT CHECK(role IN ('admin', 'teacher', 'parent', 'psychologist', 'student')) NOT NULL,
        username TEXT UNIQUE,
        password TEXT
      );
      INSERT INTO users_temp (id, name, email, role, username, password)
        SELECT id, name, email, role, username, password FROM users;
      DROP TABLE users;
      ALTER TABLE users_temp RENAME TO users;
    `);
    db.pragma("foreign_keys = ON");
  }
} catch (e) {
  console.error("Migration error on users:", e);
}

// Ensure students table has username, password, user_id columns
try { db.exec("ALTER TABLE students ADD COLUMN username TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE students ADD COLUMN password TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE students ADD COLUMN user_id INTEGER"); } catch (e) {}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Seed data if empty
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (userCount.count === 0) {
    const insertUser = db.prepare("INSERT INTO users (name, email, role, username, password) VALUES (?, ?, ?, ?, ?)");
    insertUser.run("Samandar Sohibov", "sohibovsamandar45@gmail.com", "admin", "admin", "admin");
    insertUser.run("Ism Familyangiz", "teacher@example.com", "teacher", "Ustoz1", "Ustoz1");
    insertUser.run("Ota-ona Ismi", "parent@example.com", "parent", "parent1", "pass123");
    insertUser.run("Psixolog Ismi", "psych@example.com", "psychologist", "psych1", "pass123");

    const insertStudent = db.prepare("INSERT INTO students (name, parent_id, teacher_id) VALUES (?, ?, ?)");
    insertStudent.run("Jasur Valiyev", 3, 2);

    const insertPerf = db.prepare("INSERT INTO performance_data (student_id, subject, score, attendance_rate, activity_level, month) VALUES (?, ?, ?, ?, ?, ?)");
    const months = ["Yanvar", "Fevral", "Mart"];
    const subjects = ["Matematika", "O'qish", "Ona tili"];
    
    months.forEach((m, i) => {
      subjects.forEach((s, j) => {
        const baseScore = 8 + (j % 3);
        insertPerf.run(1, s, Math.max(0, Math.min(10, baseScore - i)), 0.98 - i * 0.01, 0.85 - i * 0.03, m);
      });
    });

    const insertSchedule = db.prepare("INSERT INTO weekly_schedule (day, time, subject, teacher_id) VALUES (?, ?, ?, ?)");
    const days = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
    const times = ["08:30", "09:20", "10:10", "11:00"];
    
    days.forEach(day => {
      times.forEach((time, idx) => {
        const subject = subjects[idx % subjects.length];
        insertSchedule.run(day, time, subject, 2);
      });
    });
  }

  // Ensure Admin user (Samandar Sohibov) exists with login: admin, password: admin
  const adminUser = db.prepare("SELECT * FROM users WHERE role = 'admin' OR email = 'sohibovsamandar45@gmail.com' OR username = 'admin'").get() as any;
  if (!adminUser) {
    db.prepare("INSERT INTO users (name, email, role, username, password) VALUES (?, ?, ?, ?, ?)").run(
      "Samandar Sohibov",
      "sohibovsamandar45@gmail.com",
      "admin",
      "admin",
      "admin"
    );
  } else {
    db.prepare("UPDATE users SET role = 'admin', name = 'Samandar Sohibov', email = 'sohibovsamandar45@gmail.com', username = COALESCE(username, 'admin'), password = COALESCE(password, 'admin') WHERE id = ?").run(adminUser.id);
  }

  // Ensure teacher credentials are set as requested
  db.prepare("UPDATE users SET username = 'Ustoz1', password = 'Ustoz1' WHERE role = 'teacher' AND (username IS NULL OR username = '' OR username = 'Ustoz1')").run();

  // Ensure default student Jasur Valiyev has login and password (jasur1 / jasur123)
  const defaultStudent = db.prepare("SELECT * FROM students WHERE id = 1").get() as any;
  if (defaultStudent) {
    if (!defaultStudent.username) {
      db.prepare("UPDATE students SET username = 'jasur1', password = 'jasur123' WHERE id = 1").run();
    }
    const studentUser = db.prepare("SELECT * FROM users WHERE username = 'jasur1' OR (role = 'student' AND name = ?)").get(defaultStudent.name) as any;
    if (!studentUser) {
      const userRes = db.prepare("INSERT INTO users (name, email, role, username, password) VALUES (?, 'jasur@maktab.uz', 'student', 'jasur1', 'jasur123')").run(defaultStudent.name);
      db.prepare("UPDATE students SET user_id = ? WHERE id = 1").run(userRes.lastInsertRowid);
    } else {
      db.prepare("UPDATE users SET role = 'student', username = 'jasur1', password = 'jasur123' WHERE id = ?").run(studentUser.id);
      db.prepare("UPDATE students SET user_id = ? WHERE id = 1").run(studentUser.id);
    }
  }

  // Seed default exercises if table is empty
  const exerciseCount = db.prepare("SELECT COUNT(*) as count FROM exercises").get() as { count: number };
  if (exerciseCount.count === 0) {
    const insertEx = db.prepare("INSERT INTO exercises (title, subject, description, difficulty, points, questions, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    insertEx.run(
      "Matematika: Arifmetika va mantiqiy hisob-kitoblar",
      "Matematika",
      "Kundalik amaliy hisoblar va mantiqiy ketma-ketliklarni yechish mashqi.",
      "O'rta",
      15,
      JSON.stringify([
        {
          question: "Agar do'konda 4 ta daftar 12 000 so'm bo'lsa, 7 ta daftar qancha turadi?",
          options: ["21 000 so'm", "18 000 so'm", "24 000 so'm", "28 000 so'm"],
          correctIndex: 0,
          explanation: "1 ta daftar narxi: 12 000 / 4 = 3 000 so'm. 7 ta daftar narxi: 7 * 3 000 = 21 000 so'm."
        },
        {
          question: "Quyidagi ketma-ketlikda keyingi sonni aniqlang: 2, 6, 12, 20, 30, ...?",
          options: ["40", "42", "44", "38"],
          correctIndex: 1,
          explanation: "Oraliq farqlar 2 ga oshib bormoqda (+4, +6, +8, +10, +12). 30 + 12 = 42."
        },
        {
          question: "To'g'ri to'rtburchakning bo'yi 8 sm, eni 5 sm. Uning perimetri va yuzini toping:",
          options: ["P = 26 sm, S = 40 sm²", "P = 13 sm, S = 40 sm²", "P = 26 sm, S = 35 sm²", "P = 40 sm, S = 26 sm²"],
          correctIndex: 0,
          explanation: "Perimetr: P = 2 * (8 + 5) = 26 sm. Yuza: S = 8 * 5 = 40 sm²."
        }
      ]),
      2
    );

    insertEx.run(
      "Ona tili: Imlo qoidalari va gap bo'laklari",
      "Ona tili",
      "To'g'ri yozish ko'nikmasi va gap tarkibini mustahkamlash mashqi.",
      "Oson",
      10,
      JSON.stringify([
        {
          question: "Qaysi so'z imlo qoidasiga ko'ra to'g'ri yozilgan?",
          options: ["intellekt", "intelekt", "intelikt", "intelektual"],
          correctIndex: 0,
          explanation: "'Intellekt' so'zi ikkita 'l' harfi bilan yoziladi."
        },
        {
          question: "'Jasur a'lo baholarga o'qiyapti' gapida bosh bo'lak (ega) qaysi so'z?",
          options: ["Jasur", "a'lo", "baholarga", "o'qiyapti"],
          correctIndex: 0,
          explanation: "Kim? degan so'roqqa javob bo'lib, harakat bajaruvchisini bildirgan so'z 'Jasur'dir."
        },
        {
          question: "Sinonim (ma'nodosh) so'zlar juftligini toping:",
          options: ["Katta - ulkan", "Katta - kichik", "Baland - past", "Keng - tor"],
          correctIndex: 0,
          explanation: "'Katta' va 'ulkan' so'zlari ma'nodoshdir."
        }
      ]),
      2
    );

    insertEx.run(
      "Mantiq va Emotsional Intellekt (EQ) Mashqi",
      "Mantiq",
      "O'z hissiyotlarini tushunish, jamoada do'stona munosabat va to'g'ri qaror qabul qilish.",
      "O'rta",
      15,
      JSON.stringify([
        {
          question: "Agar do'stingiz yoki sinfdoshingiz xafa bo'lib o'tirganini ko'rsangiz, eng to'g'ri yo'l qaysi?",
          options: ["Yondashib, 'Yordam kerakmi, kayfiyating yaxshimi?' deb muloyim so'rash", "Unga e'tibor bermay chetga o'tib ketish", "Hamma oldida uning ustidan kulish", "Nega xafasan deb jahl qilish"],
          correctIndex: 0,
          explanation: "Empatiya va samimiy qo'llab-quvvatlash do'stlikni mustahkamlaydi va ijobiy muhit yaratadi."
        },
        {
          question: "Qiyin vazifa yoki imtihon oldidan paydo bo'lgan hayajonni jilovlash uchun eng foydali usul:",
          options: ["Chuqur va xotirjam nafas olib, o'z bilimiga ishonish", "Vazifani umuman bajarmasdan ketib qolish", "Jahlni boshqalarga to'kib baqirish", "Tushkunlikka tushib xafa bo'lish"],
          correctIndex: 0,
          explanation: "Diafragmal chuqur nafas mashqlari miyani kislorod bilan ta'minlaydi va diqqatni jamlaydi."
        },
        {
          question: "Jamoaviy loyihada turli fikrlar paydo bo'lganda eng oqilona yo'l qaysi?",
          options: ["Har bir fikrni hurmat bilan eshitib, umumiy murosaga kelish", "Faqat o'z fikrini majburan o'tkazish", "Boshqalarni ayblab arazlash", "Loyiha ustida ishlashni to'xtatish"],
          correctIndex: 0,
          explanation: "Murosa va boshqalarning fikrini hurmat qilish kuchli jamoa asosidir."
        }
      ]),
      2
    );

    insertEx.run(
      "Tabiiy Fanlar: Koinot va Atrof-muhit",
      "O'qish",
      "Koinot, tabiat qonunlari va ekologiya bo'yicha qiziqarli savollar.",
      "O'rta",
      10,
      JSON.stringify([
        {
          question: "Quyosh tizimidagi eng yirik sayyora qaysi?",
          options: ["Yupiter", "Saturn", "Mars", "Yer"],
          correctIndex: 0,
          explanation: "Yupiter — Quyosh tizimidagi eng yirik gaz giganti sayyorasidir."
        },
        {
          question: "Yashil o'simliklar quyosh nuri yordamida qaysi gazni yutib, kislorod ishlab chiqaradi?",
          options: ["Karbonat angidrid (CO₂)", "Azot (N₂)", "Geliy (He)", "Metan (CH₄)"],
          correctIndex: 0,
          explanation: "Fotosintez jarayonida o'simliklar karbonat angidridni yutadi va kislorod ajratadi."
        }
      ]),
      2
    );
  }

  // Seed "Meros izidan" materials with authentic curriculum stories and sequential questions
  const checkFirstMat = db.prepare("SELECT title, questions FROM heritage_materials WHERE title = 'Halol bolaning tanlovi'").get() as any;
  if (!checkFirstMat || !checkFirstMat.questions) {
    db.prepare("DELETE FROM heritage_materials").run();
    const insertMat = db.prepare(
      "INSERT INTO heritage_materials (title, type, content, connection, values_direction, questions, author_or_source) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    // 1. Halol bolaning tanlovi
    insertMat.run(
      "Halol bolaning tanlovi",
      "rivoyat",
      "Bir kuni maktabdan qaytayotgan Kamol yo‘l chetida kichik hamyonni ko‘rib qoldi. Uni olib qarasa, ichida pul va bir nechta hujjat bor ekan. Yonida ketayotgan do‘sti: “Uni biz topdik, demak, bizniki”, dedi. Kamol esa bir zum o‘ylanib qoldi. U uyida otasining: “Birovning haqqi hech qachon seniki bo‘lib qolmaydi”, degan nasihatini esladi.\n\nKamol hamyon egasi uni qidirayotgan bo‘lishi mumkinligini o‘yladi. U do‘stining taklifiga rozi bo‘lmadi va hamyonni mahalla raisiga olib bordi. Ko‘p o‘tmay uni yo‘qotgan keksa kishi topildi. U hamyonini qaytarib olgach, juda xursand bo‘ldi va Kamolga pul bermoqchi bo‘ldi. Kamol esa mukofotni olmadi.\n\n— Men faqat topgan narsamni egasiga qaytardim, — dedi u.\n\nUyga qaytayotganda Kamol qilgan ishidan ko‘ngli xotirjam ekanini his qildi. Do‘sti ham uning qarori haqida uzoq o‘ylab bordi.",
      "O‘qish savodxonligidagi “Halollik” hamda Tarbiya fanidagi odob va insoniy fazilatlar yo‘nalishi.",
      "halollik, vijdonlilik, mas’uliyat",
      JSON.stringify([
        "Kamol qanday vaziyatga duch keldi?",
        "Kamol va uning do‘stining fikrlari nimasi bilan farq qildi?",
        "Otasining nasihati Kamolning qaroriga qanday ta’sir ko‘rsatdi?",
        "Agar Kamol hamyonni o‘zida olib qolganida, qanday oqibatlar yuz berishi mumkin edi?",
        "Kamolning xatti-harakatida qaysi qadriyat namoyon bo‘ldi?",
        "Siz Kamolning qarorini qanday baholaysiz? Javobingizni asoslang."
      ]),
      "Rivoyat"
    );

    // 2. Birgalikdagi mehnat
    insertMat.run(
      "Birgalikdagi mehnat",
      "rivoyat",
      "Qadimda bir bog‘bonning katta bog‘i bo‘lgan ekan. Uning uch farzandi bor edi. Farzandlari otasiga yordam berar, ammo har biri ishni yolg‘iz bajarishni yaxshi ko‘rardi. Bir kuni kuchli shamol turib, bog‘dagi yosh nihollarning ayrimlarini egib yuboribdi.\n\nErtalab ota farzandlariga nihollarni tiklashni buyuribdi. Har biri bog‘ning bir tomonida yolg‘iz ishlay boshlabdi. Biri niholni tutishga qiynalsa, ikkinchisi tuproqni mustahkamlay olmabdi. Kun yarmiga yetgan bo‘lsa-da, ishning oz qismi bajarilibdi.\n\nShunda ota ularni yoniga chaqirib: “Har biringizning kuchingiz bor, ammo birlashmagan kuch ishni sekinlashtiradi”, debdi. Farzandlar vazifalarni bo‘lib olishibdi: biri niholni ushlab turibdi, ikkinchisi tuproq tortibdi, uchinchisi esa suv quyibdi. Kechgacha barcha nihollar tiklanibdi.\n\nFarzandlar o‘sha kuni mehnatning faqat kuch bilan emas, hamjihatlik bilan ham samarali bo‘lishini anglabdilar.",
      "Tarbiya fanidagi “Muvaffaqiyat – qat’iyat va mehnat natijasi”, shuningdek O‘qish savodxonligidagi ahillik mazmunidagi materiallar.",
      "mehnatsevarlik, ahillik, hamkorlik",
      JSON.stringify([
        "Bog‘da qanday muammo yuzaga keldi?",
        "Nima sababdan farzandlarning dastlabki mehnati samara bermadi?",
        "Otaning maslahati ularning faoliyatini qanday o‘zgartirdi?",
        "Birgalikdagi mehnat qanday natija berdi?",
        "Rivoyatda qaysi qadriyatlar bir-biri bilan bog‘langan?",
        "Sizningcha, barcha ishni ham yolg‘iz bajarish mumkinmi? Misol bilan fikringizni asoslang."
      ]),
      "Rivoyat"
    );

    // 3. Beminnat yordam
    insertMat.run(
      "Beminnat yordam",
      "rivoyat",
      "Bir qishloqda yolg‘iz yashaydigan keksa bog‘bon bor ekan. Qishning qorli kunlaridan birida uning hovlisiga ko‘p qor yog‘ib, eshik oldidagi yo‘l yopilib qolibdi. Chol belkuragini olib qorni tozalashga kirishibdi, ammo tez charchab qolibdi.\n\nMaktabdan qaytayotgan uch bola uning qiynalayotganini ko‘ribdi. Ulardan biri: “Uyga tezroq boraylik, havo sovuq”, debdi. Ikkinchisi esa: “Boboga yordam bermasak, bu ishni yolg‘iz bajarishi qiyin”, debdi. Bolalar bir qarorga kelib, cholning hovlisidagi qorni birgalikda tozalashibdi. Ish tugagach, bobo ularga rahmat aytib, uyidan shirinlik olib chiqmoqchi bo‘libdi.\n\nBolalar esa:\n— Rahmat, bobo. Biz sizga shirinlik uchun yordam bermadik, — deyishibdi.\n\nUyga qaytayotib, ular sovuqda biroz charchagan bo‘lsalar-da, qilgan ishlaridan mamnun edilar. Ularning yordamini ko‘rgan boshqa bolalar ham keyingi kuni mahalladagi yordamga muhtoj kishilardan xabar olishga kelishibdilar.",
      "O‘qish savodxonligida “Beminnat yordam”, Tarbiya fanida “Mehr-oqibat – insoniy fazilat”.",
      "mehr-oqibat, beg‘araz yordam, insonparvarlik",
      JSON.stringify([
        "Bolalar yo‘lda qanday vaziyatni ko‘rdilar?",
        "Ularning oldida qanday tanlov mavjud edi?",
        "Nima sababdan ular boboga yordam berishga qaror qildilar?",
        "Bolalarning harakati boshqalarga qanday ta’sir ko‘rsatdi?",
        "“Beminnat yordam” deganda nimani tushundingiz?",
        "Agar yordam evaziga albatta mukofot talab qilinsa, uni beminnat yaxshilik deb bo‘ladimi? Fikringizni asoslang."
      ]),
      "Rivoyat"
    );

    // 4. Qo‘shnining haqqi
    insertMat.run(
      "Qo‘shnining haqqi",
      "rivoyat",
      "Bir mahallada yonma-yon yashaydigan ikki oila bo‘lgan ekan. Birinchi oilaning hovlisida katta o‘rik daraxti bo‘lib, har yili mo‘l hosil berar ekan. Daraxtning bir qancha shoxlari qo‘shni hovliga ham egilib o‘sibdi.\n\nBir kuni oila farzandi daraxtdagi o‘riklarni terib, qo‘shni tomondagi shoxlarga ham qo‘l uzatibdi. Otasi uni to‘xtatib:\n— U shoxlar bizning daraxtimizniki-ku, — debdi bola hayron bo‘lib.\nOtasi jilmayib:\n— Daraxt bizniki, ammo uning soyasi ham, mevasi ham qo‘shnimiz hovlisiga kirib turibdi. Ne’matni baham ko‘rsak, qo‘shnichiligimiz yanada mustahkam bo‘ladi, — debdi.\n\nUlar eng yaxshi o‘riklardan bir savat qilib qo‘shnisiga olib chiqishibdi. Oradan kunlar o‘tib, qo‘shni oila ham o‘z tomorqasidan yetishtirgan sabzavotlardan ularga ulashibdi. Bolalar kattalarning bu munosabatini kuzatib, yaxshi qo‘shnichilik faqat yonma-yon yashash emasligini tushunibdilar.",
      "Tarbiya fanidagi “Mahalla va qo‘ni-qo‘shnichilik” hamda “Mehr-oqibat – insoniy fazilat” mavzulari.",
      "qo‘shnichilik, mehr-oqibat, g‘amxo‘rlik",
      JSON.stringify([
        "Ota nima uchun o‘riklardan qo‘shnisiga ham ulashishni istadi?",
        "Bolaning dastlabki fikri bilan otasining qarashi nimasi bilan farq qildi?",
        "Bir oilaning yaxshiligi ikkinchi oilaning munosabatiga qanday ta’sir ko‘rsatdi?",
        "Qo‘shnichilikni mustahkamlash uchun faqat moddiy narsa ulashish kerakmi?",
        "Rivoyatda qanday milliy-ma’naviy qadriyat aks etgan?",
        "Siz yaxshi qo‘shnichilikni qanday xatti-harakatlar orqali namoyon etgan bo‘lardingiz?"
      ]),
      "Rivoyat"
    );

    // 5. Qush inini asragan bola
    insertMat.run(
      "Qush inini asragan bola",
      "rivoyat",
      "Bahorning iliq kunlaridan birida Sardor bobosi bilan bog‘ga boribdi. U daraxtlarning birida kichkina qush inini ko‘rib qolibdi. In ichida bir nechta tuxum bor ekan. Sardor uni yaqindan ko‘rish uchun shoxga chiqmoqchi bo‘libdi.\n\nBobosi:\n— Inni bezovta qilma, bolam. Bu ham bir jonivorning uyi, — debdi.\n\nSardor daraxtdan tushibdi. Ertasiga kuchli shamol esib, in turgan shox egilib qolibdi. Sardor bobosiga yugurib borib, qush iniga yordam berishni so‘rabdi. Bobosi bilan ular inga tegmasdan, egilgan shoxni ehtiyotkorlik bilan mustahkamlab qo‘yishibdi.\n\nOradan vaqt o‘tib, tuxumlardan polaponlar chiqibdi. Sardor ularni uzoqdan kuzatibdi. Bir necha haftadan so‘ng polaponlar qanot qoqib, bog‘ uzra ucha boshlashibdi.\n\nBobosi:\n— Tabiatni asrash ba’zan katta ish qilish emas, unga zarar yetkazmaslikdan boshlanadi, — debdi.\n\nSardor o‘sha kundan boshlab bog‘dagi daraxtlar va qushlarga boshqacha e’tibor bilan qaraydigan bo‘libdi.",
      "3-sinf O‘qish darsligi mundarijasida bevosita “Qush ini” (rivoyat) hamda tabiatga munosabatga doir “Tabiat bilan suhbat” rivoyati mavjud.",
      "tabiatga g‘amxo‘rlik, mas’uliyat, jonzotlarga mehr",
      JSON.stringify([
        "Sardor dastlab qush iniga nisbatan qanday harakat qilmoqchi bo‘ldi?",
        "Bobosining nasihati uning qarorini qanday o‘zgartirdi?",
        "Shamoldan keyin Sardor qanday mas’uliyatli harakat qildi?",
        "Agar u qush inini bezovta qilganida qanday oqibat yuz berishi mumkin edi?",
        "Rivoyatda tabiatga g‘amxo‘rlik qanday namoyon bo‘lgan?",
        "Boboning “tabiatni asrash unga zarar yetkazmaslikdan boshlanadi” degan fikrini o‘z so‘zingiz bilan tushuntiring."
      ]),
      "Rivoyat"
    );
  }

  // Ensure columns exist on moral_situations for custom prompts and values direction
  try { db.prepare("ALTER TABLE moral_situations ADD COLUMN values_direction TEXT DEFAULT ''").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE moral_situations ADD COLUMN reason_prompt TEXT DEFAULT ''").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE moral_situations ADD COLUMN consequence_prompt TEXT DEFAULT ''").run(); } catch (e) {}

  // Seed "Men qanday yo‘l tutaman?" situations (ensure all 5 curriculum situations exist)
  const checkRuchka = db.prepare("SELECT title, reason_prompt FROM moral_situations WHERE title = 'Topilgan ruchka'").get() as any;
  if (!checkRuchka || !checkRuchka.reason_prompt) {
    db.prepare("DELETE FROM moral_situations").run();
    const insertSit = db.prepare(
      "INSERT INTO moral_situations (title, category, values_direction, situation_text, options, reason_prompt, consequence_prompt) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    // 1. Topilgan ruchka
    insertSit.run(
      "Topilgan ruchka",
      "Halollik va omonatdorlik",
      "halollik, o‘zgalar mulkiga hurmat",
      "Tanaffusda sinfdoshingiz yo‘lakdan chiroyli ruchka topib oldi. Kimniki ekanini bilmaysiz. Sinfdoshingiz: “Hech kim ko‘rmadi. O‘zimizda qolsin”, dedi. Siz qanday yo‘l tutasiz?",
      JSON.stringify([
        { id: 1, text: "A) Ruchkani sinfdoshimda qoldiraman, chunki uni u topdi." },
        { id: 2, text: "B) Ruchkani olib, o‘zim ishlataman." },
        { id: 3, text: "C) Egasini aniqlashga harakat qilaman, topilmasa o‘qituvchiga topshiraman." },
        { id: 4, text: "D) Bu mening ishim emas deb, aralashmayman." }
      ]),
      "Nima uchun aynan shu yo‘lni tanladingiz?",
      "Siz tanlagan yo‘l amalga oshirilsa, ruchka egasi, sinfdoshingiz va siz uchun qanday oqibat yuz berishi mumkin?"
    );

    // 2. Do‘stimga javobni aytaymi?
    insertSit.run(
      "Do‘stimga javobni aytaymi?",
      "Halollik va mas’uliyat",
      "halollik, do‘stlik, mas’uliyat",
      "Mustaqil ish davomida yaqin do‘stingiz bir savolning javobini topa olmadi. U sekingina: “Javobni ko‘rsatib yubor, hech kim bilmaydi”, dedi. Siz unga yordam berishni xohlaysiz, lekin topshiriqni har bir o‘quvchi mustaqil bajarishi kerak. Siz qanday yo‘l tutasiz?",
      JSON.stringify([
        { id: 1, text: "A) Do‘stim xafa bo‘lmasligi uchun javobimni ko‘rsataman." },
        { id: 2, text: "B) Javobni aytmayman va darsdan keyin mavzuni tushunishiga yordam berishni taklif qilaman." },
        { id: 3, text: "C) Hech narsa demay, undan yuz o‘giraman." },
        { id: 4, text: "D) O‘qituvchi ko‘rmayotgan bo‘lsa, javobni aytib yuboraman." }
      ]),
      "Nima uchun shu qarorni tanladingiz? Do‘stga yordam berish bilan uning o‘rniga topshiriqni bajarish o‘rtasida qanday farq bor?",
      "Siz tanlagan harakat do‘stingizning keyingi o‘qishiga qanday ta’sir qilishi mumkin?"
    );

    // 3. Yangi o‘quvchi
    insertSit.run(
      "Yangi o‘quvchi",
      "Mehr-oqibat va bag‘rikenglik",
      "mehr-oqibat, do‘stlik, bag‘rikenglik",
      "Sinfingizga yangi o‘quvchi keldi. Tanaffusda u yolg‘iz turibdi. Ayrim sinfdoshlaringiz uning gapirish uslubiga kulishib: “Uni o‘yinimizga qo‘shmaylik”, deyishdi. Yangi o‘quvchi buni eshitdi, ammo hech narsa demadi. Siz qanday yo‘l tutasiz?",
      JSON.stringify([
        { id: 1, text: "A) Sinfdoshlarimdan ajralib qolmaslik uchun ularga qo‘shilaman." },
        { id: 2, text: "B) Hech kim bilan tortishmasdan, vaziyatdan uzoqlashaman." },
        { id: 3, text: "C) Yangi o‘quvchini suhbat va o‘yinga taklif qilib, boshqalarga ham uni kamsitmaslikni aytaman." },
        { id: 4, text: "D) Faqat o‘qituvchi kelgandagina vaziyat haqida gapiraman." }
      ]),
      "Nima uchun aynan shu harakatni tanladingiz? Qaroringizda kimlarning manfaatini hisobga oldingiz?",
      "Sizning qaroringiz yangi o‘quvchiga va sinfdagi munosabatlarga qanday ta’sir qilishi mumkin?"
    );

    // 4. Non ortib qoldi
    insertSit.run(
      "Non ortib qoldi",
      "Tejamkorlik va ne’matni qadrlash",
      "tejamkorlik, ne’matni qadrlash, mas’uliyat",
      "Maktab oshxonasida tushlik qildingiz. Do‘stingiz yeya oladiganidan ko‘p non olgan va uning bir qismi ortib qolgan. U qolgan nonni chiqindi qutisiga tashlamoqchi. Siz qanday yo‘l tutasiz?",
      JSON.stringify([
        { id: 1, text: "A) Bu uning noni, xohlaganini qilsin deb indamayman." },
        { id: 2, text: "B) Men ham qolgan ovqatimni tashlayman." },
        { id: 3, text: "C) Uni to‘xtatib, ne’matni isrof qilmaslik kerakligini aytaman va keyingi safar kerakli miqdordagina olishni taklif qilaman." },
        { id: 4, text: "D) Faqat oshxona xodimi ko‘rsa, unga aytaman." }
      ]),
      "Nima uchun shu yo‘lni ma’qul deb bildingiz? Bu qaroringiz qaysi qadriyat bilan bog‘liq?",
      "Agar maktabdagi barcha o‘quvchilar ovqatga shunday munosabatda bo‘lsa, qanday natija yuz beradi?"
    );

    // 5. Hasharda nima qilaman?
    insertSit.run(
      "Hasharda nima qilaman?",
      "Mehnatsevarlik va hamjihatlik",
      "mehnatsevarlik, hamjihatlik, jamoaviy mas’uliyat",
      "Sinfingiz maktab hovlisidagi gulzorni tartibga keltirmoqda. Har bir o‘quvchiga yoshiga mos vazifa berilgan. Do‘stlaringizdan biri: “O‘qituvchi narigi tomonda ekan, kel, daraxt soyasida o‘tiramiz”, dedi. Siz qanday yo‘l tutasiz?",
      JSON.stringify([
        { id: 1, text: "A) Taklifga rozi bo‘lib, ular bilan o‘tiraman." },
        { id: 2, text: "B) Faqat o‘zimga berilgan ishni qilib, qolganiga e’tibor bermayman." },
        { id: 3, text: "C) “Birgalikda tezroq tugatamiz, keyin dam olamiz” deb, do‘stlarimni ishga chaqiraman." },
        { id: 4, text: "D) O‘qituvchiga borib, ularning ishlamayotganini aytaman." }
      ]),
      "Nima sababdan shu qarorga keldingiz? Jamoaviy ishda har bir kishining hissasi nima uchun muhim?",
      "Agar har bir o‘quvchi o‘z ishidan qochsa, jamoada qanday muhit shakllanadi?"
    );
  }

  // Ensure columns exist on good_deeds tables
  try { db.prepare("ALTER TABLE good_deeds_tasks ADD COLUMN value_name TEXT DEFAULT ''").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE good_deeds_records ADD COLUMN status TEXT DEFAULT 'submitted'").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE good_deeds_records ADD COLUMN completed_at DATETIME DEFAULT CURRENT_TIMESTAMP").run(); } catch (e) {}

  // Seed "Ezgu ishlarim" tasks: "Merosdan hayotga" topshiriqlari banki (10 ta qadriyat bo'yicha)
  const checkDeedBank = db.prepare("SELECT title, value_name FROM good_deeds_tasks WHERE title = 'Merosdan hayotga: Mehr-oqibat'").get() as any;
  if (!checkDeedBank || !checkDeedBank.value_name) {
    db.prepare("DELETE FROM good_deeds_tasks").run();
    const insertTask = db.prepare(
      "INSERT INTO good_deeds_tasks (title, value_name, description, category) VALUES (?, ?, ?, ?)"
    );

    // 1. Mehr-oqibat
    insertTask.run(
      "Merosdan hayotga: Mehr-oqibat",
      "Mehr-oqibat",
      "Bugun sinfda yoki oilada yordamga ehtiyoji bor kishiga bitta aniq ishda ko‘maklashing.",
      "Mehr-oqibat"
    );

    // 2. Kattalarga hurmat
    insertTask.run(
      "Merosdan hayotga: Kattalarga hurmat",
      "Kattalarga hurmat",
      "Bugun bobo-buvingiz, ota-onangiz yoki yoshi katta yaqin insoningizga yordam beradigan bitta ishni o‘zingiz taklif qilib bajaring.",
      "Kattalarga hurmat"
    );

    // 3. Mehnatsevarlik
    insertTask.run(
      "Merosdan hayotga: Mehnatsevarlik",
      "Mehnatsevarlik",
      "Sizga aytishlarini kutmasdan sinf yoki uydagi bajarilishi zarur bo‘lgan bir foydali ishni bajaring.",
      "Mehnatsevarlik"
    );

    // 4. Tejamkorlik
    insertTask.run(
      "Merosdan hayotga: Tejamkorlik",
      "Tejamkorlik",
      "Bugun suv, elektr energiyasi, qog‘oz yoki oziq-ovqatni isrof qilmaslikka qaratilgan bitta aniq harakatni amalga oshiring.",
      "Tejamkorlik"
    );

    // 5. Hamjihatlik
    insertTask.run(
      "Merosdan hayotga: Hamjihatlik",
      "Hamjihatlik",
      "Sinfdoshlaringiz yoki oila a’zolaringiz bilan umumiy foydali ishning bir qismini birgalikda bajaring.",
      "Hamjihatlik"
    );

    // 6. Tabiatga g‘amxo‘rlik
    insertTask.run(
      "Merosdan hayotga: Tabiatga g‘amxo‘rlik",
      "Tabiatga g‘amxo‘rlik",
      "O‘simlikni parvarish qilish, atrofni ozoda saqlash yoki tabiatga foydali boshqa bir ishni bajaring.",
      "Tabiatga g‘amxo‘rlik"
    );

    // 7. Mas’uliyat
    insertTask.run(
      "Merosdan hayotga: Mas’uliyat",
      "Mas’uliyat",
      "Bugun o‘zingizga tegishli vazifalardan birini eslatishsiz va o‘z vaqtida bajaring.",
      "Mas’uliyat"
    );

    // 8. Do‘stlik
    insertTask.run(
      "Merosdan hayotga: Do‘stlik",
      "Do‘stlik",
      "Sinfdoshingizga o‘qish yoki boshqa foydali faoliyatda yordam bering, lekin uning o‘rniga vazifani bajarib bermang.",
      "Do‘stlik"
    );

    // 9. Ne’matni qadrlash
    insertTask.run(
      "Merosdan hayotga: Ne’matni qadrlash",
      "Ne’matni qadrlash",
      "Bugun ovqat yoki nonni isrof qilmaslikka ongli ravishda e’tibor bering va bunga mos bitta harakatni bajaring.",
      "Ne’matni qadrlash"
    );

    // 10. Obodonchilik
    insertTask.run(
      "Merosdan hayotga: Obodonchilik",
      "Obodonchilik",
      "Sinf, uy yoki hovlingizni ozoda va tartibli saqlashga qaratilgan bitta ishni bajaring.",
      "Obodonchilik"
    );
  }

  // Bo'limlar kesimida analitik tahlil ma'lumotlarini ta'minlash (Meros va Qadriyatlar ekotizimi)
  const SECTIONS_LIST = [
    "Meros izidan",
    "Men qanday yo‘l tutaman?",
    "Ezgu ishlarim",
    "O‘zimga nazar",
    "Amaliy topshiriqlar"
  ];

  const sectionCheck = db.prepare("SELECT COUNT(*) as count FROM performance_data WHERE subject = 'Meros izidan'").get() as { count: number };
  if (sectionCheck.count === 0) {
    // Eski fanlar bo'yicha yozuvlarni tozalab, bo'limlar kesimiga yangilaymiz
    db.prepare("DELETE FROM performance_data WHERE subject IN ('Matematika', 'O''qish', 'Ona tili')").run();

    const allStudents = db.prepare("SELECT id FROM students").all() as { id: number }[];
    const months = ["Yanvar", "Fevral", "Mart"];
    const insertSectionPerf = db.prepare(
      "INSERT INTO performance_data (student_id, subject, score, attendance_rate, activity_level, month) VALUES (?, ?, ?, ?, ?, ?)"
    );

    const baseScoresBySection: Record<string, number[]> = {
      "Meros izidan": [8, 9, 10],
      "Men qanday yo‘l tutaman?": [7, 8, 9],
      "Ezgu ishlarim": [8, 9, 10],
      "O‘zimga nazar": [7, 8, 9],
      "Amaliy topshiriqlar": [8, 9, 9]
    };

    allStudents.forEach(st => {
      months.forEach((m, mIdx) => {
        SECTIONS_LIST.forEach(sec => {
          const score = baseScoresBySection[sec] ? baseScoresBySection[sec][mIdx] : 9;
          insertSectionPerf.run(
            st.id,
            sec,
            score,
            0.95 + (mIdx * 0.02),
            0.88 + (mIdx * 0.04),
            m
          );
        });
      });
    });
  }

  // Update schedule if it still has old subjects (Matematika, O'qish, Ona tili)
  const scheduleHasOld = db.prepare("SELECT COUNT(*) as count FROM weekly_schedule WHERE subject IN ('Matematika', 'O''qish', 'Ona tili')").get() as { count: number };
  if (scheduleHasOld.count > 0) {
    db.prepare("DELETE FROM weekly_schedule WHERE subject IN ('Matematika', 'O''qish', 'Ona tili')").run();
    const insertSchedule = db.prepare("INSERT INTO weekly_schedule (day, time, subject, teacher_id) VALUES (?, ?, ?, ?)");
    const days = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
    const times = ["08:30", "09:20", "10:10", "11:00"];
    const curriculumSubjects = [
      "Meros izidan: Matn tahlili",
      "Men qanday yo‘l tutaman?: Tanlov",
      "Ezgu ishlarim: Amaliy tahlil",
      "O‘zimga nazar: Refleksiya",
      "Amaliy topshiriqlar"
    ];
    days.forEach((day, dIdx) => {
      times.forEach((time, tIdx) => {
        const subject = curriculumSubjects[(dIdx + tIdx) % curriculumSubjects.length];
        insertSchedule.run(day, time, subject, 2);
      });
    });
  }

  app.get("/api/admin/curriculum-stats", (req, res) => {
    try {
      const studentsCount = (db.prepare("SELECT COUNT(*) as count FROM students").get() as any)?.count || 0;
      const teachersCount = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'").get() as any)?.count || 0;
      const parentsCount = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'parent'").get() as any)?.count || 0;
      const heritageSubs = (db.prepare("SELECT COUNT(*) as count FROM heritage_submissions").get() as any)?.count || 0;
      const moralChoices = (db.prepare("SELECT COUNT(*) as count FROM moral_choices").get() as any)?.count || 0;
      const deedsTotal = (db.prepare("SELECT COUNT(*) as count FROM good_deeds_records").get() as any)?.count || 0;
      const deedsVerified = (db.prepare("SELECT COUNT(*) as count FROM good_deeds_records WHERE teacher_verified = 1").get() as any)?.count || 0;
      const deedsPending = (db.prepare("SELECT COUNT(*) as count FROM good_deeds_records WHERE teacher_verified = 0 OR teacher_verified IS NULL").get() as any)?.count || 0;
      const exercisesSubs = (db.prepare("SELECT COUNT(*) as count FROM student_exercise_submissions").get() as any)?.count || 0;

      res.json({
        studentsCount,
        teachersCount,
        parentsCount,
        heritageSubs,
        moralChoices,
        deedsTotal,
        deedsVerified,
        deedsPending,
        exercisesSubs
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/download-source", (req, res) => {
    const filePath = path.join(__dirname, "public", "meros-tafakkur-loyiha-kodi.zip");
    if (fs.existsSync(filePath)) {
      res.download(filePath, "meros-tafakkur-loyiha-kodi.zip");
    } else {
      res.status(404).json({ error: "Loyiha zip fayli topilmadi" });
    }
  });

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    let user = db.prepare("SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?").get(username, username, password) as any;
    if (!user) {
      // Check students table directly
      const student = db.prepare("SELECT * FROM students WHERE username = ? AND password = ?").get(username, password) as any;
      if (student) {
        user = {
          id: student.user_id || (1000 + student.id),
          studentId: student.id,
          name: student.name,
          email: `${student.username}@maktab.uz`,
          role: 'student',
          username: student.username,
          password: student.password
        };
      }
    } else if (user.role === 'student') {
      const student = db.prepare("SELECT * FROM students WHERE user_id = ? OR username = ?").get(user.id, user.username) as any;
      if (student) {
        user.studentId = student.id;
      }
    }
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Login yoki parol noto'g'ri" });
    }
  });

  app.get("/api/students", (req, res) => {
    const students = db.prepare(`
      SELECT s.*, u1.name as parent_name, u2.name as teacher_name, u2.email as teacher_email
      FROM students s 
      LEFT JOIN users u1 ON s.parent_id = u1.id
      LEFT JOIN users u2 ON s.teacher_id = u2.id
      ORDER BY s.id ASC
    `).all();
    res.json(students);
  });

  app.post("/api/users", (req, res) => {
    const { name, email, role, username, password } = req.body;
    try {
      const info = db.prepare("INSERT INTO users (name, email, role, username, password) VALUES (?, ?, ?, ?, ?)").run(name, email, role, username, password);
      res.json({ id: info.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Email yoki login band" });
    }
  });

  app.post("/api/students/add", (req, res) => {
    const { name, parentId, teacherId, username, password } = req.body;
    try {
      const studentUsername = (username && username.trim()) ? username.trim() : `student_${Date.now().toString().slice(-4)}`;
      const studentPassword = (password && password.trim()) ? password.trim() : 'Talaba123!';

      // Check if username already exists in users or students
      const existingUser = db.prepare("SELECT id FROM users WHERE username = ?").get(studentUsername);
      const existingStudent = db.prepare("SELECT id FROM students WHERE username = ?").get(studentUsername);
      if (existingUser || existingStudent) {
        return res.status(400).json({ error: "Ushbu login allaqachon band. Iltimos boshqa login tanlang." });
      }

      // Create user record for student
      const email = `${studentUsername}@maktab.uz`;
      const userInsert = db.prepare("INSERT INTO users (name, email, role, username, password) VALUES (?, ?, 'student', ?, ?)")
        .run(name, email, studentUsername, studentPassword);
      const userId = userInsert.lastInsertRowid;

      const info = db.prepare("INSERT INTO students (name, parent_id, teacher_id, username, password, user_id) VALUES (?, ?, ?, ?, ?, ?)")
        .run(name, parentId, teacherId, studentUsername, studentPassword, userId);
      const studentId = info.lastInsertRowid;

      // Generate initial performance data for new student in bo'limlar
      const insertPerf = db.prepare("INSERT INTO performance_data (student_id, subject, score, attendance_rate, activity_level, month) VALUES (?, ?, ?, ?, ?, ?)");
      const months = ["Yanvar", "Fevral", "Mart"];
      const sections = ["Meros izidan", "Men qanday yo‘l tutaman?", "Ezgu ishlarim", "O‘zimga nazar", "Amaliy topshiriqlar"];
      
      months.forEach((m, i) => {
        sections.forEach((s) => {
          const score = Math.floor(Math.random() * 3) + 8; // 8 to 10
          insertPerf.run(studentId, s, score, 0.95 + (i * 0.02), 0.88 + (i * 0.03), m);
        });
      });

      res.json({ id: studentId, username: studentUsername, password: studentPassword });
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Xatolik yuz berdi" });
    }
  });

  app.put("/api/students/:id/credentials", (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Login va parolni to'liq kiriting" });
    }
    try {
      const student = db.prepare("SELECT * FROM students WHERE id = ?").get(id) as any;
      if (!student) {
        return res.status(404).json({ error: "O'quvchi topilmadi" });
      }

      // Check if new username is taken by another user or student
      const otherUser = db.prepare("SELECT id FROM users WHERE username = ? AND id != ?").get(username, student.user_id || -1);
      const otherStudent = db.prepare("SELECT id FROM students WHERE username = ? AND id != ?").get(username, id);
      if (otherUser || otherStudent) {
        return res.status(400).json({ error: "Ushbu login boshqa foydalanuvchi tomonidan band" });
      }

      // Update students table
      db.prepare("UPDATE students SET username = ?, password = ? WHERE id = ?").run(username, password, id);

      // Update or create in users table
      if (student.user_id) {
        db.prepare("UPDATE users SET name = ?, username = ?, password = ? WHERE id = ?").run(student.name, username, password, student.user_id);
      } else {
        const email = `${username}@maktab.uz`;
        const userInsert = db.prepare("INSERT INTO users (name, email, role, username, password) VALUES (?, ?, 'student', ?, ?)")
          .run(student.name, email, username, password);
        db.prepare("UPDATE students SET user_id = ? WHERE id = ?").run(userInsert.lastInsertRowid, id);
      }

      res.json({ success: true, username, password });
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Xatolik yuz berdi" });
    }
  });

  // Exercises routes
  app.get("/api/exercises", (req, res) => {
    const exercises = db.prepare("SELECT * FROM exercises ORDER BY id ASC").all() as any[];
    const formatted = exercises.map(ex => ({
      ...ex,
      questions: JSON.parse(ex.questions || "[]")
    }));
    res.json(formatted);
  });

  app.post("/api/exercises", (req, res) => {
    const { title, subject, description, difficulty, points, questions, created_by } = req.body;
    try {
      const info = db.prepare(
        "INSERT INTO exercises (title, subject, description, difficulty, points, questions, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(
        title,
        subject,
        description || "",
        difficulty || "O'rta",
        points || 10,
        JSON.stringify(questions || []),
        created_by || null
      );
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Xatolik yuz berdi" });
    }
  });

  app.get("/api/exercises/submissions", (req, res) => {
    const subs = db.prepare(`
      SELECT sub.*, s.name as student_name, ex.title as exercise_title, ex.subject
      FROM student_exercise_submissions sub
      JOIN students s ON sub.student_id = s.id
      JOIN exercises ex ON sub.exercise_id = ex.id
      ORDER BY sub.completed_at DESC
    `).all();
    res.json(subs);
  });

  app.get("/api/exercises/submissions/:studentId", (req, res) => {
    const subs = db.prepare(`
      SELECT sub.*, s.name as student_name, ex.title as exercise_title, ex.subject
      FROM student_exercise_submissions sub
      JOIN students s ON sub.student_id = s.id
      JOIN exercises ex ON sub.exercise_id = ex.id
      WHERE sub.student_id = ?
      ORDER BY sub.completed_at DESC
    `).all(req.params.studentId);
    res.json(subs);
  });

  app.post("/api/exercises/submit", (req, res) => {
    const { student_id, exercise_id, score, total_questions } = req.body;
    try {
      const info = db.prepare(
        "INSERT INTO student_exercise_submissions (student_id, exercise_id, score, total_questions) VALUES (?, ?, ?, ?)"
      ).run(student_id, exercise_id, score, total_questions);

      // Also register score in performance_data for "Amaliy topshiriqlar" bo'limi
      if (student_id) {
        const calculatedScore = Math.min(10, Math.max(5, Math.round((score / Math.max(1, total_questions)) * 10)));
        const currentMonth = new Date().toLocaleString('uz-UZ', { month: 'long' });
        db.prepare("INSERT INTO performance_data (student_id, subject, score, attendance_rate, activity_level, month) VALUES (?, 'Amaliy topshiriqlar', ?, 0.98, 0.95, ?)").run(
          student_id,
          calculatedScore,
          currentMonth
        );
      }

      res.json({ id: info.lastInsertRowid, success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Xatolik yuz berdi" });
    }
  });

  // 1. Heritage Materials & Submissions API
  app.get("/api/heritage-materials", (req, res) => {
    try {
      const materials = db.prepare("SELECT * FROM heritage_materials ORDER BY id ASC").all() as any[];
      const parsed = materials.map(m => ({
        ...m,
        questions: typeof m.questions === 'string' ? JSON.parse(m.questions) : (m.questions || [])
      }));
      res.json(parsed);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/heritage-materials", (req, res) => {
    const { title, type, content, connection, values_direction, questions, author_or_source } = req.body;
    try {
      const info = db.prepare(
        "INSERT INTO heritage_materials (title, type, content, connection, values_direction, questions, author_or_source) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(title, type, content, connection || '', values_direction || '', JSON.stringify(questions || []), author_or_source || '');
      res.json({ id: info.lastInsertRowid, success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/heritage-submissions", (req, res) => {
    try {
      const subs = db.prepare(`
        SELECT hs.*, s.name as student_name, hm.title as material_title, hm.type as material_type, hm.values_direction, hm.author_or_source
        FROM heritage_submissions hs
        JOIN students s ON hs.student_id = s.id
        JOIN heritage_materials hm ON hs.material_id = hm.id
        ORDER BY hs.completed_at DESC
      `).all() as any[];
      const parsed = subs.map(s => ({
        ...s,
        answers: typeof s.answers === 'string' ? JSON.parse(s.answers) : s.answers
      }));
      res.json(parsed);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/heritage-submissions/:studentId", (req, res) => {
    try {
      const subs = db.prepare(`
        SELECT hs.*, s.name as student_name, hm.title as material_title, hm.type as material_type, hm.values_direction, hm.author_or_source
        FROM heritage_submissions hs
        JOIN students s ON hs.student_id = s.id
        JOIN heritage_materials hm ON hs.material_id = hm.id
        WHERE hs.student_id = ?
        ORDER BY hs.completed_at DESC
      `).all(req.params.studentId) as any[];
      const parsed = subs.map(s => ({
        ...s,
        answers: typeof s.answers === 'string' ? JSON.parse(s.answers) : s.answers
      }));
      res.json(parsed);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/heritage-submissions", (req, res) => {
    const { student_id, material_id, answers } = req.body;
    try {
      const info = db.prepare(
        "INSERT INTO heritage_submissions (student_id, material_id, answers) VALUES (?, ?, ?)"
      ).run(student_id, material_id, JSON.stringify(answers));

      const mat = db.prepare("SELECT title FROM heritage_materials WHERE id = ?").get(material_id) as any;
      if (student_id && mat) {
        db.prepare("INSERT INTO eq_notes (student_id, teacher_id, note, mood) VALUES (?, 1, ?, 'quvnoq')").run(
          student_id,
          `"Meros izidan": "${mat.title}" qadriyatlar tahlilini muvaffaqiyatli bajardi.`
        );
        const currentMonth = new Date().toLocaleString('uz-UZ', { month: 'long' });
        db.prepare("INSERT INTO performance_data (student_id, subject, score, attendance_rate, activity_level, month) VALUES (?, 'Meros izidan', 10, 0.98, 0.96, ?)").run(
          student_id,
          currentMonth
        );
      }

      res.json({ id: info.lastInsertRowid, success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 2. Moral Situations & Choices API
  app.get("/api/moral-situations", (req, res) => {
    try {
      const situations = db.prepare("SELECT * FROM moral_situations ORDER BY id ASC").all() as any[];
      const parsed = situations.map(sit => ({
        ...sit,
        options: typeof sit.options === 'string' ? JSON.parse(sit.options) : sit.options
      }));
      res.json(parsed);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/moral-situations", (req, res) => {
    const { title, category, situation_text, options, values_direction, reason_prompt, consequence_prompt } = req.body;
    try {
      const info = db.prepare(
        "INSERT INTO moral_situations (title, category, values_direction, situation_text, options, reason_prompt, consequence_prompt) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(title, category, values_direction || '', situation_text, JSON.stringify(options), reason_prompt || '', consequence_prompt || '');
      res.json({ id: info.lastInsertRowid, success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/moral-choices", (req, res) => {
    try {
      const choices = db.prepare(`
        SELECT mc.*, s.name as student_name, ms.title as situation_title, ms.situation_text, ms.category
        FROM moral_choices mc
        JOIN students s ON mc.student_id = s.id
        JOIN moral_situations ms ON mc.situation_id = ms.id
        ORDER BY mc.created_at DESC
      `).all();
      res.json(choices);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/moral-choices/:studentId", (req, res) => {
    try {
      const choices = db.prepare(`
        SELECT mc.*, s.name as student_name, ms.title as situation_title, ms.situation_text, ms.category
        FROM moral_choices mc
        JOIN students s ON mc.student_id = s.id
        JOIN moral_situations ms ON mc.situation_id = ms.id
        WHERE mc.student_id = ?
        ORDER BY mc.created_at DESC
      `).all(req.params.studentId);
      res.json(choices);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/moral-choices", (req, res) => {
    const { student_id, situation_id, selected_option_id, selected_option_text, reason, expected_consequence } = req.body;
    try {
      const info = db.prepare(
        "INSERT INTO moral_choices (student_id, situation_id, selected_option_id, selected_option_text, reason, expected_consequence) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(student_id, situation_id, selected_option_id, selected_option_text, reason, expected_consequence);

      const sit = db.prepare("SELECT title FROM moral_situations WHERE id = ?").get(situation_id) as any;
      if (student_id && sit) {
        db.prepare("INSERT INTO eq_notes (student_id, teacher_id, note, mood) VALUES (?, 1, ?, 'ijobiy')").run(
          student_id,
          `"Men qanday yo'l tutaman?": "${sit.title}" vaziyatida mustaqil ma'naviy tanlov qildi va o'z qarori oqibatini tahlil etdi.`
        );
      }

      res.json({ id: info.lastInsertRowid, success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 3. Good Deeds Tasks & Records API
  app.get("/api/good-deeds/tasks", (req, res) => {
    try {
      const tasks = db.prepare("SELECT * FROM good_deeds_tasks ORDER BY id ASC").all();
      res.json(tasks);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/good-deeds/tasks", (req, res) => {
    const { title, value_name, description, category } = req.body;
    try {
      const info = db.prepare(
        "INSERT INTO good_deeds_tasks (title, value_name, description, category) VALUES (?, ?, ?, ?)"
      ).run(title, value_name || category || '', description, category);
      res.json({ id: info.lastInsertRowid, success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/good-deeds/records", (req, res) => {
    try {
      const records = db.prepare(`
        SELECT gdr.*, s.name as student_name, gdt.title as task_title, gdt.description as task_description, gdt.value_name
        FROM good_deeds_records gdr
        JOIN students s ON gdr.student_id = s.id
        LEFT JOIN good_deeds_tasks gdt ON gdr.task_id = gdt.id
        ORDER BY gdr.created_at DESC
      `).all();
      res.json(records);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/good-deeds/records/:studentId", (req, res) => {
    try {
      const records = db.prepare(`
        SELECT gdr.*, s.name as student_name, gdt.title as task_title, gdt.description as task_description, gdt.value_name
        FROM good_deeds_records gdr
        JOIN students s ON gdr.student_id = s.id
        LEFT JOIN good_deeds_tasks gdt ON gdr.task_id = gdt.id
        WHERE gdr.student_id = ?
        ORDER BY gdr.created_at DESC
      `).all(req.params.studentId);
      res.json(records);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/good-deeds/records", (req, res) => {
    const { student_id, task_id, what_done, with_whom, result_impact, status } = req.body;
    try {
      const finalStatus = status || 'submitted';
      const info = db.prepare(
        "INSERT INTO good_deeds_records (student_id, task_id, what_done, with_whom, result_impact, status) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(student_id, task_id || null, what_done, with_whom, result_impact, finalStatus);

      if (student_id) {
        db.prepare("INSERT INTO eq_notes (student_id, teacher_id, note, mood) VALUES (?, 1, ?, 'quvnoq')").run(
          student_id,
          `"Merosdan hayotga": Yangi amaliy ezgu ish qayd etildi: "${what_done.substring(0, 50)}..."`
        );
      }

      res.json({ id: info.lastInsertRowid, success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/good-deeds/verify/:id", (req, res) => {
    const { id } = req.params;
    const { teacher_feedback, status } = req.body;
    try {
      const finalStatus = status || (teacher_feedback?.trim() ? 'feedback_given' : 'reviewed');
      db.prepare(
        "UPDATE good_deeds_records SET teacher_verified = 1, teacher_feedback = ?, status = ? WHERE id = ?"
      ).run(teacher_feedback || "Pedagog tomonidan ko‘rib chiqildi va ijobiy baholandi.", finalStatus, id);

      const record = db.prepare("SELECT student_id, what_done FROM good_deeds_records WHERE id = ?").get(id) as any;
      if (record && record.student_id && teacher_feedback) {
        db.prepare("INSERT INTO eq_notes (student_id, teacher_id, note, mood) VALUES (?, 1, ?, 'ilhomlangan')").run(
          record.student_id,
          `Ustoz fikri: "${teacher_feedback.substring(0, 80)}..."`
        );
      }

      res.json({ success: true, status: finalStatus });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/students/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM performance_data WHERE student_id = ?").run(id);
    db.prepare("DELETE FROM eq_notes WHERE student_id = ?").run(id);
    db.prepare("DELETE FROM students WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    // Check if user is a parent of any student
    const parentStudents = db.prepare("SELECT id FROM students WHERE parent_id = ?").all(id);
    if (parentStudents.length > 0) {
      return res.status(400).json({ error: "Ushbu ota-onaga biriktirilgan o'quvchilar bor. Avval o'quvchilarni o'chiring." });
    }
    // Check if user is a teacher of any student
    const teacherStudents = db.prepare("SELECT id FROM students WHERE teacher_id = ?").all(id);
    if (teacherStudents.length > 0) {
      return res.status(400).json({ error: "Ushbu ustozga biriktirilgan o'quvchilar bor. Avval o'quvchilarni boshqa ustozga biriktiring yoki o'chiring." });
    }
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/users/parents", (req, res) => {
    const parents = db.prepare("SELECT * FROM users WHERE role = 'parent'").all();
    res.json(parents);
  });

  app.get("/api/users/teachers", (req, res) => {
    const teachers = db.prepare("SELECT * FROM users WHERE role = 'teacher'").all();
    res.json(teachers);
  });

  app.put("/api/users/:id/credentials", (req, res) => {
    const { username, password } = req.body;
    const { id } = req.params;
    try {
      db.prepare("UPDATE users SET username = ?, password = ? WHERE id = ?").run(username, password, id);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Login band bo'lishi mumkin yoki boshqa xatolik" });
    }
  });

  app.put("/api/users/:id", (req, res) => {
    const { name } = req.body;
    const { id } = req.params;
    try {
      db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, id);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Xatolik yuz berdi" });
    }
  });

  app.get("/api/users/:id", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "Foydalanuvchi topilmadi" });
    }
  });

  app.get("/api/messages/:userId", (req, res) => {
    const messages = db.prepare(`
      SELECT m.*, u1.name as sender_name, u2.name as receiver_name 
      FROM messages m
      JOIN users u1 ON m.sender_id = u1.id
      JOIN users u2 ON m.receiver_id = u2.id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      ORDER BY m.created_at ASC
    `).all(req.params.userId, req.params.userId);
    res.json(messages);
  });

  app.get("/api/performance/:studentId", (req, res) => {
    const data = db.prepare("SELECT * FROM performance_data WHERE student_id = ? ORDER BY id ASC").all(req.params.studentId);
    res.json(data);
  });

  app.get("/api/eq-notes/:studentId", (req, res) => {
    const notes = db.prepare(`
      SELECT n.*, u.name as teacher_name 
      FROM eq_notes n 
      JOIN users u ON n.teacher_id = u.id 
      WHERE n.student_id = ? 
      ORDER BY n.created_at DESC
    `).all(req.params.studentId);
    res.json(notes);
  });

  app.post("/api/eq-notes", (req, res) => {
    const { studentId, teacherId, note, mood } = req.body;
    const info = db.prepare("INSERT INTO eq_notes (student_id, teacher_id, note, mood) VALUES (?, ?, ?, ?)").run(studentId, teacherId, note, mood);
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/performance", (req, res) => {
    const { studentId, subject, score, month } = req.body;
    const info = db.prepare("INSERT INTO performance_data (student_id, subject, score, attendance_rate, activity_level, month) VALUES (?, ?, ?, ?, ?, ?)").run(
      studentId, 
      subject, 
      score, 
      0.95, // default attendance
      0.8,  // default activity
      month || new Date().toLocaleString('uz-UZ', { month: 'long' })
    );
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/messages", (req, res) => {
    const messages = db.prepare(`
      SELECT m.*, u1.name as sender_name, u2.name as receiver_name 
      FROM messages m
      JOIN users u1 ON m.sender_id = u1.id
      JOIN users u2 ON m.receiver_id = u2.id
      ORDER BY m.created_at ASC
    `).all();
    res.json(messages);
  });

  app.post("/api/messages", (req, res) => {
    const { senderId, receiverId, content } = req.body;
    const info = db.prepare("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)").run(senderId, receiverId, content);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/schedule", (req, res) => {
    const schedule = db.prepare("SELECT * FROM weekly_schedule ORDER BY day, time").all();
    res.json(schedule);
  });

  app.post("/api/schedule", (req, res) => {
    const { day, time, subject, teacher_id } = req.body;
    const info = db.prepare("INSERT INTO weekly_schedule (day, time, subject, teacher_id) VALUES (?, ?, ?, ?)").run(day, time, subject, teacher_id);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/schedule/:id", (req, res) => {
    db.prepare("DELETE FROM weekly_schedule WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
