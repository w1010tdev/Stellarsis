package com.stellarsis.app.models

import com.google.gson.annotations.SerializedName

/**
 * 用户信息数据类
 */
data class User(
    @SerializedName("id") val id: Int,
    @SerializedName("username") val username: String,
    @SerializedName("nickname") val nickname: String,
    @SerializedName("color") val color: String?,
    @SerializedName("badge") val badge: String?,
    @SerializedName("role") val role: String?
)

/**
 * 登录请求数据类
 */
data class LoginRequest(
    @SerializedName("username") val username: String,
    @SerializedName("password") val password: String,
    @SerializedName("device_name") val deviceName: String
)

/**
 * 登录响应数据类
 */
data class LoginResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String?,
    @SerializedName("token") val token: String?,
    @SerializedName("expires_at") val expiresAt: String?,
    @SerializedName("user") val user: User?
)

/**
 * 通用API响应数据类
 */
data class ApiResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String?
)

/**
 * 验证Token响应
 */
data class ValidateResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("user") val user: User?
)

/**
 * 未读消息数据类
 */
data class UnreadCount(
    @SerializedName("name") val name: String,
    @SerializedName("count") val count: Int
)

/**
 * 未读通知响应数据类
 */
data class UnreadNotificationsResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("total_unread") val totalUnread: Int,
    @SerializedName("chat") val chat: Map<String, UnreadCount>?,
    @SerializedName("forum") val forum: Map<String, UnreadCount>?,
    @SerializedName("message") val message: String?
)
