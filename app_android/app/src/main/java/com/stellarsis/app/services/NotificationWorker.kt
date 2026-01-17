package com.stellarsis.app.services

import android.content.Context
import androidx.work.*
import com.stellarsis.app.api.ApiClient
import com.stellarsis.app.utils.NotificationHelper
import com.stellarsis.app.utils.TokenManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

/**
 * 后台通知检查 Worker
 * 定期检查未读消息并发送通知
 */
class NotificationWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    
    private val tokenManager = TokenManager(applicationContext)
    private val notificationHelper = NotificationHelper(applicationContext)
    
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val token = tokenManager.getToken()
            if (token == null) {
                // 未登录，停止工作
                return@withContext Result.success()
            }
            
            val response = ApiClient.apiService.getUnreadNotifications(
                ApiClient.getBearerToken(token)
            )
            
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!
                val totalUnread = data.totalUnread
                
                if (totalUnread > 0) {
                    val chatCount = data.chat?.values?.sumOf { it.count } ?: 0
                    val forumCount = data.forum?.values?.sumOf { it.count } ?: 0
                    
                    notificationHelper.showUnreadNotification(
                        totalUnread = totalUnread,
                        chatCount = chatCount,
                        forumCount = forumCount
                    )
                }
            }
            
            Result.success()
        } catch (e: Exception) {
            e.printStackTrace()
            Result.retry()
        }
    }
    
    companion object {
        private const val WORK_NAME = "stellarsis_notification_check"
        
        /**
         * 启动定期检查任务
         */
        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            
            val request = PeriodicWorkRequestBuilder<NotificationWorker>(
                15, TimeUnit.MINUTES  // 最小间隔15分钟
            )
                .setConstraints(constraints)
                .setBackoffCriteria(
                    BackoffPolicy.LINEAR,
                    WorkRequest.MIN_BACKOFF_MILLIS,
                    TimeUnit.MILLISECONDS
                )
                .build()
            
            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(
                    WORK_NAME,
                    ExistingPeriodicWorkPolicy.KEEP,
                    request
                )
        }
        
        /**
         * 立即执行一次检查
         */
        fun checkNow(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            
            val request = OneTimeWorkRequestBuilder<NotificationWorker>()
                .setConstraints(constraints)
                .build()
            
            WorkManager.getInstance(context).enqueue(request)
        }
        
        /**
         * 取消定期检查任务
         */
        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }
    }
}
