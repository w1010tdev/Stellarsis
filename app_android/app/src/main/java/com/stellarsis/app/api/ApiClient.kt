package com.stellarsis.app.api

import com.stellarsis.app.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * API 客户端单例
 * 请修改 BASE_URL 为你的服务器地址
 */
object ApiClient {
    
    // TODO: 修改为你的服务器地址
    private const val BASE_URL = "http://10.0.2.2:5000/"  // Android 模拟器访问本机地址
    // 如果是真机测试，请使用实际的服务器 IP 或域名
    // private const val BASE_URL = "http://192.168.1.100:5000/"
    // private const val BASE_URL = "https://your-domain.com/"
    
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        // 仅在调试模式下记录请求/响应体，避免生产环境泄露敏感信息
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BODY
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
    }
    
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
    
    val apiService: ApiService = retrofit.create(ApiService::class.java)
    
    /**
     * 获取带有 Bearer 前缀的 Token
     */
    fun getBearerToken(token: String): String {
        return "Bearer $token"
    }
}
