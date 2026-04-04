package com.stellarsis.mobile.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.stellarsis.mobile.network.NetworkModule

class NotificationSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters,
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            NetworkModule.init(applicationContext)
            NetworkModule.apiService.notifications(limit = 20, offset = 0)
            Result.success()
        } catch (e: Exception) {
            Log.w("NotificationSyncWorker", "sync notifications failed", e)
            Result.retry()
        }
    }
}
