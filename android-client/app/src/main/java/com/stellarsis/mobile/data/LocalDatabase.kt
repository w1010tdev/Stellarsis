package com.stellarsis.mobile.data

import android.content.Context
import androidx.room.Database
import androidx.room.Dao
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase

@Entity(tableName = "chat_messages")
data class ChatMessageEntity(
    @PrimaryKey val id: Int,
    val roomId: Int,
    val content: String,
    val timestamp: String,
    val userId: Int,
    val username: String,
    val nickname: String?,
)

@Dao
interface ChatMessageDao {
    @Query("SELECT * FROM chat_messages WHERE roomId = :roomId ORDER BY id ASC")
    suspend fun listByRoom(roomId: Int): List<ChatMessageEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertAll(messages: List<ChatMessageEntity>)

    @Query("DELETE FROM chat_messages WHERE roomId = :roomId")
    suspend fun clearRoom(roomId: Int)
}

@Database(entities = [ChatMessageEntity::class], version = 1, exportSchema = false)
abstract class StellarsisDatabase : RoomDatabase() {
    abstract fun chatMessageDao(): ChatMessageDao

    companion object {
        @Volatile private var INSTANCE: StellarsisDatabase? = null

        fun get(context: Context): StellarsisDatabase {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    StellarsisDatabase::class.java,
                    "stellarsis.db"
                ).fallbackToDestructiveMigration().build().also { INSTANCE = it }
            }
        }
    }
}
