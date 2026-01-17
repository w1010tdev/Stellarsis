package com.stellarsis.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.stellarsis.app.api.ApiClient
import com.stellarsis.app.api.SocketManager
import com.stellarsis.app.databinding.ActivityMainBinding
import com.stellarsis.app.services.NotificationWorker
import com.stellarsis.app.utils.NotificationHelper
import com.stellarsis.app.utils.TokenManager
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * 主界面
 * 显示用户信息和未读消息统计
 * 使用 WebSocket 实时获取消息通知
 */
class MainActivity : AppCompatActivity() {
    
    companion object {
        private const val HEARTBEAT_INTERVAL_MS = 30000L // 30秒心跳间隔
    }
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var tokenManager: TokenManager
    private lateinit var notificationHelper: NotificationHelper
    private lateinit var socketManager: SocketManager
    
    private var lastUnreadCount = 0
    private val heartbeatHandler = Handler(Looper.getMainLooper())
    private val heartbeatRunnable = object : Runnable {
        override fun run() {
            socketManager.sendHeartbeat()
            heartbeatHandler.postDelayed(this, HEARTBEAT_INTERVAL_MS)
        }
    }
    
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            Toast.makeText(this, "通知权限已开启", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "通知权限被拒绝，将无法接收消息通知", Toast.LENGTH_LONG).show()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        tokenManager = TokenManager(this)
        notificationHelper = NotificationHelper(this)
        socketManager = SocketManager.getInstance()
        
        // 检查登录状态
        if (!tokenManager.isLoggedIn()) {
            startLoginActivity()
            return
        }
        
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupViews()
        setupSocketManager()
        requestNotificationPermission()
        startNotificationService()
    }
    
    override fun onResume() {
        super.onResume()
        if (tokenManager.isLoggedIn()) {
            // 取消通知（用户已打开应用）
            notificationHelper.cancelNotification()
            // 请求最新未读消息
            if (socketManager.isConnected()) {
                socketManager.requestUnreadNotifications()
            } else {
                connectWebSocket()
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        heartbeatHandler.removeCallbacks(heartbeatRunnable)
    }
    
    private fun setupViews() {
        // 显示用户信息
        binding.tvUsername.text = tokenManager.getNickname() ?: tokenManager.getUsername() ?: "用户"
        
        // 刷新按钮
        binding.btnRefresh.setOnClickListener {
            refreshData()
        }
        
        // 登出按钮
        binding.btnLogout.setOnClickListener {
            showLogoutDialog()
        }
    }
    
    private fun setupSocketManager() {
        // 设置回调
        socketManager.onUnreadNotifications = { total, chatCount, forumCount ->
            runOnUiThread {
                updateUnreadUI(total, chatCount, forumCount)
                
                // 如果未读数增加且应用在后台，发送通知
                if (total > lastUnreadCount && total > 0) {
                    notificationHelper.showUnreadNotification(total, chatCount, forumCount)
                }
                lastUnreadCount = total
            }
        }
        
        socketManager.onConnectionChanged = { connected ->
            runOnUiThread {
                if (connected) {
                    binding.tvStatus.text = "已连接"
                    // 开始心跳
                    heartbeatHandler.post(heartbeatRunnable)
                } else {
                    binding.tvStatus.text = "连接断开，正在重连..."
                    heartbeatHandler.removeCallbacks(heartbeatRunnable)
                }
            }
        }
        
        socketManager.onAuthError = {
            runOnUiThread {
                Toast.makeText(this, "登录已过期，请重新登录", Toast.LENGTH_SHORT).show()
                performLogout()
            }
        }
        
        // 连接 WebSocket
        connectWebSocket()
    }
    
    private fun connectWebSocket() {
        val token = tokenManager.getToken()
        if (token != null) {
            binding.tvStatus.text = "正在连接..."
            socketManager.connect(ApiClient.WS_URL, token)
        }
    }
    
    private fun refreshData() {
        binding.btnRefresh.isEnabled = false
        binding.tvStatus.text = "正在刷新..."
        
        if (socketManager.isConnected()) {
            socketManager.requestUnreadNotifications()
            binding.btnRefresh.isEnabled = true
        } else {
            // 如果 WebSocket 未连接，重新连接
            connectWebSocket()
            binding.btnRefresh.isEnabled = true
        }
    }
    
    private fun updateUnreadUI(total: Int, chatCount: Int, forumCount: Int) {
        binding.tvTotalUnread.text = "未读消息总数: $total"
        binding.tvChatUnread.text = "聊天消息: $chatCount 条未读"
        binding.tvForumUnread.text = "论坛更新: $forumCount 条未读"
        
        val now = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        binding.tvStatus.text = "上次更新: $now"
    }
    
    private fun showLogoutDialog() {
        AlertDialog.Builder(this)
            .setTitle("确认登出")
            .setMessage("确定要退出登录吗？")
            .setPositiveButton("确定") { _, _ ->
                performLogout()
            }
            .setNegativeButton("取消", null)
            .show()
    }
    
    private fun performLogout() {
        // 断开 WebSocket
        socketManager.disconnect()
        heartbeatHandler.removeCallbacks(heartbeatRunnable)
        
        lifecycleScope.launch {
            try {
                val token = tokenManager.getToken()
                if (token != null) {
                    // 通知服务器登出
                    ApiClient.apiService.logout(ApiClient.getBearerToken(token))
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
            
            // 清除本地 Token
            tokenManager.clearToken()
            
            // 停止通知服务
            NotificationWorker.cancel(this@MainActivity)
            
            Toast.makeText(this@MainActivity, "已登出", Toast.LENGTH_SHORT).show()
            startLoginActivity()
        }
    }
    
    private fun startLoginActivity() {
        startActivity(Intent(this, LoginActivity::class.java))
        finish()
    }
    
    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            when {
                ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED -> {
                    // 已有权限
                }
                shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS) -> {
                    AlertDialog.Builder(this)
                        .setTitle("需要通知权限")
                        .setMessage("为了及时提醒您新消息，请允许通知权限")
                        .setPositiveButton("确定") { _, _ ->
                            requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                        }
                        .setNegativeButton("取消", null)
                        .show()
                }
                else -> {
                    requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }
        }
    }
    
    private fun startNotificationService() {
        // 启动定期检查任务（作为 WebSocket 断开时的备用）
        NotificationWorker.schedule(this)
    }
}
