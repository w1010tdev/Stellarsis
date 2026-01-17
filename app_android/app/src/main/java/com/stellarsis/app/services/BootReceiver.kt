package com.stellarsis.app.services

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.stellarsis.app.utils.TokenManager

/**
 * 开机启动接收器
 * 设备启动后重新启动通知检查服务
 */
class BootReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val tokenManager = TokenManager(context)
            if (tokenManager.isLoggedIn()) {
                // 用户已登录，启动通知检查
                NotificationWorker.schedule(context)
            }
        }
    }
}
