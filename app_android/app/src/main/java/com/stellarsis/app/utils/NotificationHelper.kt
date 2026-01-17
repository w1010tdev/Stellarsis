package com.stellarsis.app.utils

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.stellarsis.app.MainActivity
import com.stellarsis.app.R

/**
 * 通知帮助类
 * 负责创建和显示系统通知
 */
class NotificationHelper(private val context: Context) {
    
    companion object {
        const val CHANNEL_ID = "stellarsis_messages"
        const val CHANNEL_NAME = "消息通知"
        const val CHANNEL_DESCRIPTION = "Stellarsis 新消息提醒"
        const val NOTIFICATION_ID = 1001
    }
    
    init {
        createNotificationChannel()
    }
    
    /**
     * 创建通知渠道（Android 8.0+）
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, importance).apply {
                description = CHANNEL_DESCRIPTION
                enableVibration(true)
                enableLights(true)
            }
            
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    /**
     * 显示未读消息通知
     */
    fun showUnreadNotification(totalUnread: Int, chatCount: Int, forumCount: Int) {
        if (totalUnread <= 0) return
        
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        
        val pendingIntent = PendingIntent.getActivity(
            context, 
            0, 
            intent, 
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        val contentText = buildNotificationText(chatCount, forumCount)
        
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Stellarsis - 新消息")
            .setContentText(contentText)
            .setNumber(totalUnread)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setStyle(NotificationCompat.BigTextStyle().bigText(contentText))
            .build()
        
        try {
            NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
        } catch (e: SecurityException) {
            // 用户可能拒绝了通知权限
            e.printStackTrace()
        }
    }
    
    /**
     * 构建通知文本
     */
    private fun buildNotificationText(chatCount: Int, forumCount: Int): String {
        val parts = mutableListOf<String>()
        if (chatCount > 0) {
            parts.add("$chatCount 条聊天消息")
        }
        if (forumCount > 0) {
            parts.add("$forumCount 条论坛更新")
        }
        return if (parts.isEmpty()) {
            "您有新的未读消息"
        } else {
            "您有 ${parts.joinToString("，")}"
        }
    }
    
    /**
     * 取消通知
     */
    fun cancelNotification() {
        NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
    }
}
