package com.stellarsis.app

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.stellarsis.app.api.ApiClient
import com.stellarsis.app.databinding.ActivityLoginBinding
import com.stellarsis.app.models.LoginRequest
import com.stellarsis.app.utils.TokenManager
import kotlinx.coroutines.launch

/**
 * 登录界面
 */
class LoginActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityLoginBinding
    private lateinit var tokenManager: TokenManager
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        tokenManager = TokenManager(this)
        
        // 如果已登录，直接跳转到主界面
        if (tokenManager.isLoggedIn()) {
            startMainActivity()
            return
        }
        
        setupViews()
    }
    
    private fun setupViews() {
        binding.btnLogin.setOnClickListener {
            val username = binding.etUsername.text.toString().trim()
            val password = binding.etPassword.text.toString()
            
            if (username.isEmpty()) {
                binding.etUsername.error = "请输入用户名"
                return@setOnClickListener
            }
            
            if (password.isEmpty()) {
                binding.etPassword.error = "请输入密码"
                return@setOnClickListener
            }
            
            performLogin(username, password)
        }
    }
    
    private fun performLogin(username: String, password: String) {
        binding.btnLogin.isEnabled = false
        binding.btnLogin.text = "登录中..."
        
        lifecycleScope.launch {
            try {
                val request = LoginRequest(
                    username = username,
                    password = password,
                    deviceName = "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}"
                )
                
                val response = ApiClient.apiService.login(request)
                
                if (response.isSuccessful && response.body()?.success == true) {
                    val loginResponse = response.body()!!
                    
                    // 保存 Token
                    tokenManager.saveToken(
                        token = loginResponse.token!!,
                        userId = loginResponse.user!!.id,
                        username = loginResponse.user.username,
                        nickname = loginResponse.user.nickname,
                        expiresAt = loginResponse.expiresAt
                    )
                    
                    Toast.makeText(this@LoginActivity, "登录成功", Toast.LENGTH_SHORT).show()
                    startMainActivity()
                } else {
                    val message = response.body()?.message ?: "登录失败"
                    Toast.makeText(this@LoginActivity, message, Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                e.printStackTrace()
                Toast.makeText(
                    this@LoginActivity, 
                    "网络错误: ${e.message}", 
                    Toast.LENGTH_SHORT
                ).show()
            } finally {
                binding.btnLogin.isEnabled = true
                binding.btnLogin.text = "登录"
            }
        }
    }
    
    private fun startMainActivity() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
