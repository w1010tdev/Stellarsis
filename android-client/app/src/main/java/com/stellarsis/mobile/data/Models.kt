package com.stellarsis.mobile.data

data class ApiEnvelope<T>(
    val success: Boolean = false,
    val message: String? = null,
    val error: String? = null,
    val data: T? = null,
)

data class LoginRequest(val username: String, val password: String)

data class LoginUser(val id: Int, val username: String, val is_admin: Boolean = false)

data class LoginResponse(
    val success: Boolean,
    val message: String? = null,
    val error: String? = null,
    val user: LoginUser? = null,
)

data class RoomDto(val id: Int, val name: String, val description: String = "")

data class ForumSectionDto(val id: Int, val name: String, val description: String = "")

data class UserDto(
    val id: Int,
    val username: String,
    val nickname: String? = null,
    val color: String? = null,
    val badge: String? = null,
    val is_admin: Boolean? = null,
)

data class BootstrapPayload(
    val user: UserDto,
    val rooms: List<RoomDto> = emptyList(),
    val sections: List<ForumSectionDto> = emptyList(),
    val chatPermissions: Map<String, String> = emptyMap(),
    val forumPermissions: Map<String, String> = emptyMap(),
    val following: List<UserDto> = emptyList(),
)

data class ChatMessageDto(
    val id: Int,
    val content: String,
    val timestamp: String,
    val user_id: Int,
    val username: String,
    val nickname: String? = null,
    val color: String? = null,
    val badge: String? = null,
)

data class ChatHistoryResponse(
    val messages: List<ChatMessageDto> = emptyList(),
    val page: Int? = null,
    val total_pages: Int? = null,
    val has_more: Boolean? = null,
)

data class SendChatRequest(val room_id: Int, val message: String)

data class MobileNotificationDto(
    val id: Int,
    val type: String,
    val title: String,
    val body: String,
    val payload: Map<String, Any?> = emptyMap(),
    val is_read: Boolean = false,
    val created_at: String,
)

data class NotificationsResponse(
    val success: Boolean,
    val notifications: List<MobileNotificationDto> = emptyList(),
)

data class PushTokenRequest(
    val token: String,
    val platform: String = "android",
    val device_id: String = "",
)

data class FollowListResponse(
    val success: Boolean,
    val following: List<UserDto> = emptyList(),
)

data class UploadQuotaData(
    val used: Int,
    val total: Int,
    val is_admin: Boolean = false,
    val percent: Double = 0.0,
)

data class UploadQuotaResponse(
    val success: Boolean,
    val quota: UploadQuotaData? = null,
)
