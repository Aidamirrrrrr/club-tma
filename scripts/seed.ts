import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { eq, and } from "drizzle-orm";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/club";

const client = postgres(connectionString);
const db = drizzle(client, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await db.delete(schema.registrations);
  await db.delete(schema.events);
  await db.delete(schema.users);
  console.log("🗑️  Cleared old data");

  // ── Users ──
  const usersData: schema.NewUser[] = [
    {
      telegramId: "100001",
      firstName: "Алексей",
      lastName: "Петров",
      username: "alexey_p",
      photoUrl: "https://i.pravatar.cc/300?img=11",
      bio: "Основатель клуба. Фронтенд-разработчик и организатор.",
      instagram: "@alexey.dev",
      telegram: "@alexey_p",
      phone: "+7 916 100-00-01",
      role: "admin",
    },
    {
      telegramId: "100002",
      firstName: "Дарья",
      lastName: "Волкова",
      username: "dasha_v",
      photoUrl: "https://i.pravatar.cc/300?img=5",
      bio: "Дизайнер интерьеров. Организую творческие встречи.",
      instagram: "@dasha.design",
      telegram: "@dasha_v",
      phone: "+7 925 200-00-02",
      role: "admin",
    },
    {
      telegramId: "100003",
      firstName: "Максим",
      lastName: "Соколов",
      username: "max_sokolov",
      photoUrl: "https://i.pravatar.cc/300?img=12",
      bio: "Фотограф и путешественник. Всегда в движении.",
      instagram: "@max.photo",
      telegram: "@max_sokolov",
      phone: "+7 903 300-00-03",
      role: "user",
    },
    {
      telegramId: "100004",
      firstName: "Анна",
      lastName: "Кузнецова",
      username: "anna_k",
      photoUrl: "https://i.pravatar.cc/300?img=9",
      bio: "Преподаватель йоги. Люблю природу и путешествия.",
      instagram: "@anna.yoga",
      telegram: "@anna_k",
      phone: "",
      role: "user",
    },
    {
      telegramId: "100005",
      firstName: "Дмитрий",
      lastName: "Новиков",
      username: "dima_n",
      photoUrl: "https://i.pravatar.cc/300?img=14",
      bio: "Спортсмен. Тренер по кроссфиту.",
      instagram: "@dima.sport",
      telegram: "@dima_n",
      phone: "+7 926 500-00-05",
      role: "user",
    },
    {
      telegramId: "100006",
      firstName: "Екатерина",
      lastName: "Морозова",
      username: "kate_m",
      photoUrl: "https://i.pravatar.cc/300?img=20",
      bio: "Повар. Веду кулинарные мастер-классы.",
      instagram: "@kate.cook",
      telegram: "@kate_m",
      phone: "+7 915 600-00-06",
      role: "user",
    },
    {
      telegramId: "100007",
      firstName: "Иван",
      lastName: "Козлов",
      username: "ivan_k",
      photoUrl: "https://i.pravatar.cc/300?img=33",
      bio: "Backend-разработчик. Увлекаюсь электроникой.",
      instagram: "",
      telegram: "@ivan_k",
      phone: "",
      role: "user",
    },
    {
      telegramId: "100008",
      firstName: "Мария",
      lastName: "Лебедева",
      username: "masha_l",
      photoUrl: "https://i.pravatar.cc/300?img=25",
      bio: "Стилист. Помогу подобрать образ.",
      instagram: "@masha.style",
      telegram: "@masha_l",
      phone: "+7 909 800-00-08",
      role: "user",
    },
    {
      telegramId: "100009",
      firstName: "Артём",
      lastName: "Смирнов",
      username: "artem_s",
      photoUrl: "https://i.pravatar.cc/300?img=53",
      bio: "",
      instagram: "",
      telegram: "@artem_s",
      phone: "",
      role: "user",
    },
    {
      telegramId: "100010",
      firstName: "Ольга",
      lastName: "Попова",
      username: "olga_p",
      photoUrl: "https://i.pravatar.cc/300?img=44",
      bio: "Психолог. Провожу консультации и групповые сессии.",
      instagram: "@olga.psy",
      telegram: "@olga_p",
      phone: "+7 917 100-10-10",
      role: "user",
    },
    {
      telegramId: "100011",
      firstName: "Никита",
      lastName: "Фёдоров",
      username: "nikita_f",
      photoUrl: "https://i.pravatar.cc/300?img=57",
      bio: "Музыкант. Играю на гитаре и барабанах.",
      instagram: "@nikita.music",
      telegram: "@nikita_f",
      phone: "",
      role: "user",
    },
    {
      telegramId: "100012",
      firstName: "Полина",
      lastName: "Егорова",
      username: "polina_e",
      photoUrl: "https://i.pravatar.cc/300?img=47",
      bio: "Учитель английского. Люблю настолки.",
      instagram: "@polina.eng",
      telegram: "@polina_e",
      phone: "+7 962 120-12-12",
      role: "user",
    },
  ];

  // Insert users
  const insertedUsers: schema.User[] = [];
  for (const u of usersData) {
    const [result] = await db
      .insert(schema.users)
      .values(u)
      .onConflictDoUpdate({
        target: schema.users.telegramId,
        set: { firstName: u.firstName },
      })
      .returning();
    if (result) insertedUsers.push(result);
  }
  console.log(`✅ ${insertedUsers.length} users ready`);

  // ── Events ──
  const eventsData: schema.NewEvent[] = [
    {
      title: "Хайкинг на Сулакский каньон",
      description:
        "Однодневный поход к одному из самых глубоких каньонов мира. Встречаемся у входа в 7 утра, берём с собой воду, перекус и хорошее настроение. Маршрут средней сложности, подойдёт для подготовленных.",
      date: "2026-03-15",
      time: "07:00",
      location: "Сулакский каньон, Дагестан",
      coverUrl:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      maxParticipants: 20,
      status: "open",
      createdBy: insertedUsers[0]?.id,
    },
    {
      title: "Мастер-класс по дагестанской кухне",
      description:
        "Готовим хинкал, чуду и курзе вместе с шеф-поваром Заремой. Все ингредиенты включены. С собой только фартук и аппетит!",
      date: "2026-03-08",
      time: "14:00",
      location: "Кулинарная студия «Очаг», ул. Ленина 42",
      coverUrl:
        "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80",
      maxParticipants: 12,
      status: "open",
      createdBy: insertedUsers[1]?.id,
    },
    {
      title: "Фотопрогулка по старому городу",
      description:
        "Гуляем по историческим улицам с фотографом Рустамом. Научимся основам мобильной фотографии и поймаём лучший свет. Подходит для всех уровней.",
      date: "2026-03-22",
      time: "16:00",
      location: "Старый город, у мечети Джума",
      coverUrl:
        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
      maxParticipants: 15,
      status: "open",
      createdBy: insertedUsers[0]?.id,
    },
    {
      title: "Йога на рассвете",
      description:
        "Утренняя практика йоги на свежем воздухе с видом на горы. Коврики предоставляются. Начинающие приветствуются!",
      date: "2026-04-05",
      time: "06:30",
      location: "Парк «Ак-Гёль»",
      coverUrl:
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
      maxParticipants: 25,
      status: "open",
      createdBy: insertedUsers[1]?.id,
    },
    {
      title: "Вечер настольных игр",
      description:
        "Настолки для всех: от Каркассона до Мафии. Приходите одни или с друзьями — мы всех перемешаем! Чай и печеньки включены.",
      date: "2026-03-01",
      time: "18:00",
      location: "Антикафе «Время»",
      coverUrl:
        "https://images.unsplash.com/photo-1611891487122-207579d67d98?w=800&q=80",
      maxParticipants: 30,
      status: "open",
      createdBy: insertedUsers[0]?.id,
    },
    {
      title: "Турнир по мини-футболу",
      description:
        "Дружеский турнир 5 на 5. Формируем команды на месте. Призы для победителей! Требуется спортивная форма и сменная обувь.",
      date: "2026-02-14",
      time: "10:00",
      location: "Спорткомплекс «Динамо»",
      coverUrl:
        "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
      maxParticipants: 20,
      status: "completed",
      createdBy: insertedUsers[0]?.id,
    },
    {
      title: "Лекция: Как начать свой бизнес",
      description:
        "Предприниматель Магомед расскажет о своём опыте запуска 3 проектов. Разберём ошибки, поговорим о финансах и мотивации.",
      date: "2026-01-25",
      time: "19:00",
      location: "Коворкинг «Старт»",
      coverUrl:
        "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80",
      maxParticipants: 40,
      status: "completed",
      createdBy: insertedUsers[1]?.id,
    },
    {
      title: "Музыкальный джем-сейшн",
      description:
        "Открытый джем для музыкантов любого уровня. Приносите свои инструменты! Бэклайн предоставляется.",
      date: "2026-02-01",
      time: "20:00",
      location: "Клуб «Аккорд»",
      coverUrl:
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80",
      maxParticipants: 0,
      status: "completed",
      createdBy: insertedUsers[0]?.id,
    },
    {
      title: "Книжный клуб: обсуждение",
      description:
        "Обсуждаем «Сто лет одиночества» Маркеса. Прочитайте заранее — будет интересно! Чай и кофе за наш счёт.",
      date: "2026-04-12",
      time: "17:00",
      location: "Библиотека им. Расула Гамзатова",
      coverUrl:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
      maxParticipants: 15,
      status: "open",
      createdBy: insertedUsers[1]?.id,
    },
    {
      title: "Субботник в парке",
      description:
        "Совместная уборка и озеленение парка. Перчатки и инструменты выдадим. После — пикник для участников!",
      date: "2026-04-19",
      time: "09:00",
      location: "Парк «Ак-Гёль»",
      coverUrl:
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
      maxParticipants: 50,
      status: "open",
      createdBy: insertedUsers[0]?.id,
    },
  ];

  const insertedEvents: schema.Event[] = [];
  for (const e of eventsData) {
    const [result] = await db
      .insert(schema.events)
      .values(e)
      .onConflictDoUpdate({
        target: schema.events.title,
        set: { title: e.title },
      })
      .returning();
    if (result) insertedEvents.push(result);
  }
  console.log(`✅ ${insertedEvents.length} events ready`);

  // ── Registrations ──
  const registrationMap: Record<number, number[]> = {
    0: [0, 2, 3, 4, 6, 7, 9, 10],
    1: [1, 3, 5, 7, 8, 11],
    2: [0, 2, 7, 9, 10, 11],
    3: [1, 3, 5, 8, 9],
    4: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    5: [0, 2, 4, 6, 10],
    6: [0, 1, 3, 5, 7, 8, 9, 11],
    7: [0, 2, 10],
    8: [1, 3, 7, 9, 11],
    9: [0, 1, 2, 3, 4, 5],
  };

  let regCount = 0;
  for (const [eventIdx, userIdxs] of Object.entries(registrationMap)) {
    const event = insertedEvents[Number(eventIdx)];
    if (!event) continue;
    for (const userIdx of userIdxs) {
      const user = insertedUsers[userIdx];
      if (!user) continue;
      await db
        .insert(schema.registrations)
        .values({ userId: user.id, eventId: event.id })
        .onConflictDoNothing();
      regCount++;
    }
  }
  console.log(`✅ ${regCount} registrations created`);

  console.log("\n🎉 Seed complete!");
  console.log(`   ${insertedUsers.length} users`);
  console.log(`   ${insertedEvents.length} events`);
  console.log(`   ${regCount} registrations`);

  await client.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
