package com.stellarsis.app.utils

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Token 管理器
 * 使用加密的 SharedPreferences 安全存储用户 Token
 */
class TokenManager(context: Context) {
    
    companion object {
        private const val PREFS_NAME = "stellarsis_secure_prefs"
        private const val KEY_TOKEN = "api_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USERNAME = "username"
        private const val KEY_NICKNAME = "nickname"
        private const val KEY_EXPIRES_AT = "expires_at"
    }
    
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
    
    private val sharedPreferences: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        PREFS_NAME,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
    
    /**
     * 保存登录信息
     */
    fun saveToken(
        token: String,
        userId: Int,
        username: String,
        nickname: String,
        expiresAt: String?
    ) {
        sharedPreferences.edit().apply {
            putString(KEY_TOKEN, token)
            putInt(KEY_USER_ID, userId)
            putString(KEY_USERNAME, username)
            putString(KEY_NICKNAME, nickname)
            putString(KEY_EXPIRES_AT, expiresAt)
            apply()
        }
    }
    
    /**
     * 获取 Token
     */
    fun getToken(): String? {
        return sharedPreferences.getString(KEY_TOKEN, null)
    }
    
    /**
     * 获取用户 ID
     */
    fun getUserId(): Int {
        return sharedPreferences.getInt(KEY_USER_ID, -1)
    }
    
    /**
     * 获取用户名
     */
    fun getUsername(): String? {
        return sharedPreferences.getString(KEY_USERNAME, null)
    }
    
    /**
     * 获取昵称
     */
    fun getNickname(): String? {
        return sharedPreferences.getString(KEY_NICKNAME, null)
    }
    
    /**
     * 检查是否已登录
     */
    fun isLoggedIn(): Boolean {
        return getToken() != null
    }
    
    /**
     * 清除所有登录信息（登出）
     */
    fun clearToken() {
        sharedPreferences.edit().clear().apply()
    }
}
