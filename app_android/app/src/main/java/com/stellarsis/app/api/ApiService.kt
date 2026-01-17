package com.stellarsis.app.api

import com.stellarsis.app.models.*
import retrofit2.Response
import retrofit2.http.*

/**
 * Stellarsis API 服务接口
 */
interface ApiService {
    
    /**
     * 用户登录
     */
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>
    
    /**
     * 用户登出
     */
    @POST("api/auth/logout")
    suspend fun logout(@Header("Authorization") token: String): Response<ApiResponse>
    
    /**
     * 验证Token
     */
    @GET("api/auth/validate")
    suspend fun validateToken(@Header("Authorization") token: String): Response<ValidateResponse>
    
    /**
     * 获取未读消息
     */
    @GET("api/notifications/unread")
    suspend fun getUnreadNotifications(@Header("Authorization") token: String): Response<UnreadNotificationsResponse>
}
