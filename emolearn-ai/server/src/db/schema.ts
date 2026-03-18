import { pgTable, uuid, varchar, text, integer, real, boolean, timestamp, jsonb, primaryKey } from 'drizzle-orm/pg-core'

export const classes = pgTable('classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacher_id: uuid('teacher_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  invite_code: varchar('invite_code', { length: 10 }).unique().notNull(),
  created_at: timestamp('created_at').defaultNow(),
})

export const classStudents = pgTable('class_students', {
  class_id: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
  student_id: uuid('student_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  joined_at: timestamp('joined_at').defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.class_id, t.student_id] })
}))

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).default('student'),
  avatar_url: text('avatar_url'),
  university: varchar('university', { length: 100 }),
  course: integer('course'),
  created_at: timestamp('created_at').defaultNow(),
})

export const biometricSessions = pgTable('biometric_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id),
  started_at: timestamp('started_at').defaultNow(),
  ended_at: timestamp('ended_at'),
  avg_bpm: real('avg_bpm'),
  avg_emotion: varchar('avg_emotion', { length: 50 }),
  avg_cognitive: real('avg_cognitive'),
  stress_count: integer('stress_count').default(0),
})

export const emotionLogs = pgTable('emotion_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  session_id: uuid('session_id').references(() => biometricSessions.id),
  user_id: uuid('user_id').references(() => users.id),
  timestamp: timestamp('timestamp').defaultNow(),
  emotion: varchar('emotion', { length: 50 }),
  confidence: real('confidence'),
  bpm: integer('bpm'),
  cognitive: real('cognitive'),
})

export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 100 }),
  content: text('content'),
  difficulty: integer('difficulty').default(5),
  language: varchar('language', { length: 10 }).default('kz'),
  created_at: timestamp('created_at').defaultNow(),
})

export const studentProgress = pgTable('student_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id),
  lesson_id: uuid('lesson_id').references(() => lessons.id),
  completed: boolean('completed').default(false),
  score: real('score'),
  time_spent: integer('time_spent'),
  completed_at: timestamp('completed_at'),
})

export const signWords = pgTable('sign_words', {
  id: uuid('id').primaryKey().defaultRandom(),
  word_kz: varchar('word_kz', { length: 100 }).notNull(),
  word_ru: varchar('word_ru', { length: 100 }),
  category: varchar('category', { length: 50 }),
  difficulty: varchar('difficulty', { length: 20 }),
  image_url: text('image_url'),
  landmarks: jsonb('landmarks'),
})

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id),
  role: varchar('role', { length: 20 }),
  content: text('content'),
  created_at: timestamp('created_at').defaultNow(),
})

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacher_id: uuid('teacher_id').references(() => users.id),
  student_id: uuid('student_id').references(() => users.id),
  type: varchar('type', { length: 50 }),
  message: text('message'),
  is_read: boolean('is_read').default(false),
  created_at: timestamp('created_at').defaultNow(),
})

export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => users.id),
  badge: varchar('badge', { length: 100 }),
  earned_at: timestamp('earned_at').defaultNow(),
})
