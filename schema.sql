CREATE TABLE IF NOT EXISTS user_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    question_id TEXT,
    answer TEXT,
    approved INTEGER DEFAULT 0 
);

