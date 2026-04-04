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

data class UserDto(
    val id: Int,
    val username: String,
    val nickname: String? = null,
    val color: String? = null,
    val badge: String? = null,
    val is_admin: Boolean? = null,
)

data class RoomDto(val id: Int, val name: String, val description: String = "")

data class ForumSectionDto(val id: Int, val name: String, val description: String = "")

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

data class OnlineUsersResponse(
    val count: Int = 0,
    val users: List<UserDto> = emptyList(),
    val success: Boolean = true,
    val message: String? = null,
)

data class UnreadCountsResponse(
    val success: Boolean,
    val chat: Map<String, Int> = emptyMap(),
    val forum: Map<String, Int> = emptyMap(),
    val message: String? = null,
)

data class ForumThreadUser(
    val id: Int,
    val username: String,
    val nickname: String? = null,
    val color: String? = null,
    val badge: String? = null,
)

data class ForumThreadDto(
    val id: Int,
    val title: String,
    val content: String,
    val section_id: Int? = null,
    val timestamp: String,
    val reply_count: Int? = null,
    val user: ForumThreadUser? = null,
)

data class ForumReplyDto(
    val id: Int,
    val content: String,
    val timestamp: String,
    val user: ForumThreadUser? = null,
)

data class ForumSectionDetailResponse(
    val success: Boolean,
    val section: ForumSectionDto? = null,
    val permission: String? = null,
    val threads: List<ForumThreadDto> = emptyList(),
    val message: String? = null,
)

data class ForumThreadDetailResponse(
    val success: Boolean,
    val thread: ForumThreadDto? = null,
    val permission: String? = null,
    val replies: List<ForumReplyDto> = emptyList(),
    val message: String? = null,
)

data class FollowListResponse(
    val success: Boolean,
    val following: List<UserDto> = emptyList(),
)

data class FollowToggleRequest(val user_id: Int)

data class FollowToggleResponse(
    val success: Boolean,
    val action: String? = null,
    val message: String? = null,
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

data class UploadedFileItem(
    val id: Int,
    val filename: String,
    val url: String,
    val markdown: String,
    val uploaded: String,
    val is_image: Boolean,
)

data class UploadedFilesResponse(
    val success: Boolean,
    val images: List<UploadedFileItem> = emptyList(),
    val message: String? = null,
)

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

data class ProfileUpdateRequest(
    val nickname: String? = null,
    val color: String? = null,
    val badge: String? = null,
)

data class ChangePasswordRequest(
    val old_password: String,
    val new_password: String,
    val confirm_password: String,
)

