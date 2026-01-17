package com.stellarsis.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.stellarsis.app.api.ApiClient
import com.stellarsis.app.databinding.ActivityMainBinding
import com.stellarsis.app.services.NotificationWorker
import com.stellarsis.app.utils.NotificationHelper
import com.stellarsis.app.utils.TokenManager
import kotlinx.coroutines.launch

/**
 * 主界面
 * 显示用户信息和未读消息统计
 */
class MainActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityMainBinding
    private lateinit var tokenManager: TokenManager
    private lateinit var notificationHelper: NotificationHelper
    
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
        
        // 检查登录状态
        if (!tokenManager.isLoggedIn()) {
            startLoginActivity()
            return
        }
        
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupViews()
        requestNotificationPermission()
        startNotificationService()
        refreshData()
    }
    
    override fun onResume() {
        super.onResume()
        if (tokenManager.isLoggedIn()) {
            refreshData()
            // 取消通知（用户已打开应用）
            notificationHelper.cancelNotification()
        }
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
    
    private fun refreshData() {
        binding.btnRefresh.isEnabled = false
        binding.tvStatus.text = "正在刷新..."
        
        lifecycleScope.launch {
            try {
                val token = tokenManager.getToken()
                if (token == null) {
                    startLoginActivity()
                    return@launch
                }
                
                val response = ApiClient.apiService.getUnreadNotifications(
                    ApiClient.getBearerToken(token)
                )
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val data = response.body()!!
                    
                    // 更新 UI
                    binding.tvTotalUnread.text = "未读消息总数: ${data.totalUnread}"
                    
                    // 聊天未读
                    val chatCount = data.chat?.values?.sumOf { it.count } ?: 0
                    binding.tvChatUnread.text = "聊天消息: $chatCount 条未读"
                    
                    // 论坛未读
                    val forumCount = data.forum?.values?.sumOf { it.count } ?: 0
                    binding.tvForumUnread.text = "论坛更新: $forumCount 条未读"
                    
                    binding.tvStatus.text = "上次刷新: ${java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date())}"
                    
                } else if (response.code() == 401) {
                    // Token 失效
                    Toast.makeText(this@MainActivity, "登录已过期，请重新登录", Toast.LENGTH_SHORT).show()
                    performLogout()
                } else {
                    val message = response.body()?.message ?: "获取数据失败"
                    binding.tvStatus.text = "错误: $message"
                }
                
            } catch (e: Exception) {
                e.printStackTrace()
                binding.tvStatus.text = "网络错误: ${e.message}"
            } finally {
                binding.btnRefresh.isEnabled = true
            }
        }
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
        // 启动定期检查任务
        NotificationWorker.schedule(this)
    }
}
