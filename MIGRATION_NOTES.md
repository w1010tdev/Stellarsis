# Database Migration Notes

## created_at Column Migration

### Issue
When upgrading from an older version of Stellarsis, users may encounter:
```
sqlite3.OperationalError: no such column: users.created_at
```

### Solution
The application now includes automatic database migration that runs on startup.

### What Gets Migrated
- **User table**: Adds `created_at` column if missing
- **Default value**: Existing users get current timestamp as their creation date

### How It Works
1. On app startup, `init_db()` is called
2. `migrate_database()` runs first, checking for missing columns
3. If `users.created_at` is missing, it's added automatically
4. Existing user records are updated with current timestamp
5. App continues normal initialization

### Manual Migration (if needed)
If you prefer to migrate manually:
```sql
-- Check if column exists
PRAGMA table_info(users);

-- Add column if missing
ALTER TABLE users ADD COLUMN created_at DATETIME;

-- Update existing users
UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
```

### Technical Details
- Migration is idempotent (safe to run multiple times)
- Uses SQLite's `ALTER TABLE` with `UPDATE` to handle default values
- Non-blocking: If migration fails, app still attempts to start
- Logs migration status for debugging

### Future Migrations
Additional migrations can be added to the `migrate_database()` function following the same pattern:
1. Check if change is needed
2. Apply change with SQL
3. Log the result
