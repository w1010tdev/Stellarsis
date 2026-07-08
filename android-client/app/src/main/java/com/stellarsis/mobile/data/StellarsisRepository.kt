package com.stellarsis.mobile.data

import android.content.Context
import android.util.Log
import com.stellarsis.mobile.BuildConfig
import com.stellarsis.mobile.network.NetworkModule
import com.stellarsis.mobile.network.SocketManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import org.json.JSONObject
import java.io.File

class StellarsisRepository(context: Context) {
    private val api = NetworkModule.apiService
    private val db = StellarsisDatabase.get(context)
    private val socketManager = SocketManager()

    private val _bootstrap = MutableStateFlow<BootstrapPayload?>(null)
    val bootstrap: StateFlow<BootstrapPayload?> = _bootstrap.asStateFlow()

    private val _chatMessages = MutableStateFlow<Map<Int, List<ChatMessageDto>>>(emptyMap())
    val chatMessages: StateFlow<Map<Int, List<ChatMessageDto>>> = _chatMessages.asStateFlow()

    private val _notifications = MutableStateFlow<List<MobileNotificationDto>>(emptyList())
    val notifications: StateFlow<List<MobileNotificationDto>> = _notifications.asStateFlow()

    private val _following = MutableStateFlow<List<UserDto>>(emptyList())
    val following: StateFlow<List<UserDto>> = _following.asStateFlow()

    private val _uploadQuota = MutableStateFlow<UploadQuotaData?>(null)
    val uploadQuota: StateFlow<UploadQuotaData?> = _uploadQuota.asStateFlow()

    private val _uploads = MutableStateFlow<List<UploadedFileItem>>(emptyList())
    val uploads: StateFlow<List<UploadedFileItem>> = _uploads.asStateFlow()

    private val _onlineUsers = MutableStateFlow<List<UserDto>>(emptyList())
    val onlineUsers: StateFlow<List<UserDto>> = _onlineUsers.asStateFlow()

    private val _unreadChat = MutableStateFlow<Map<Int, Int>>(emptyMap())
    val unreadChat: StateFlow<Map<Int, Int>> = _unreadChat.asStateFlow()

    private val _unreadForum = MutableStateFlow<Map<Int, Int>>(emptyMap())
    val unreadForum: StateFlow<Map<Int, Int>> = _unreadForum.asStateFlow()

    suspend fun login(username: String, password: String): Result<LoginResponse> = runCatching {
        api.login(LoginRequest(username, password))
    }

    suspend fun logout(): Result<Unit> = runCatching {
        api.logoutRaw()
    }

    suspend fun updateProfile(nickname: String?, color: String?, badge: String?): Result<Unit> = runCatching {
        val resp = api.updateProfile(ProfileUpdateRequest(nickname = nickname, color = color, badge = badge))
        if (!resp.success) error(resp.message ?: resp.error ?: "更新资料失败")
    }

    suspend fun changePassword(old: String, new: String, confirm: String): Result<Unit> = runCatching {
        val resp = api.changePassword(ChangePasswordRequest(old_password = old, new_password = new, confirm_password = confirm))
        if (!resp.success) error(resp.message ?: resp.error ?: "修改密码失败")
    }

    suspend fun loadBootstrap(): Result<BootstrapPayload> = runCatching {
        val resp = api.bootstrap()
        if (!resp.success || resp.data == null) error(resp.message ?: "加载失败")
        _bootstrap.value = resp.data
        resp.data
    }

    suspend fun loadRoomMessages(roomId: Int): Result<List<ChatMessageDto>> = runCatching {
        val resp = api.chatHistory(roomId = roomId)
        val list = resp.messages
        db.chatMessageDao().clearRoom(roomId)
        db.chatMessageDao().upsertAll(list.map {
            ChatMessageEntity(
                id = it.id,
                roomId = roomId,
                content = it.content,
                timestamp = it.timestamp,
                userId = it.user_id,
                username = it.username,
                nickname = it.nickname,
            )
        })
        _chatMessages.value = _chatMessages.value.toMutableMap().apply { put(roomId, list) }
        list
    }

    suspend fun sendMessage(roomId: Int, text: String): Result<Unit> = runCatching {
        val resp = api.sendChat(SendChatRequest(room_id = roomId, message = text))
        if (!resp.success) error(resp.message ?: "发送失败")
    }

    suspend fun deleteMessage(roomId: Int, messageId: Int): Result<Unit> = runCatching {
        val resp = api.deleteChatMessage(roomId, messageId)
        if (!resp.success) error(resp.message ?: "删除失败")
    }

    suspend fun loadOnlineUsers(roomId: Int): Result<List<UserDto>> = runCatching {
        val resp = api.onlineUsers(roomId)
        if (resp.success) {
            _onlineUsers.value = resp.users
            resp.users
        } else {
            error(resp.message ?: "在线用户加载失败")
        }
    }

    suspend fun loadUnreadCounts(): Result<Unit> = runCatching {
        val resp = api.unreadCounts()
        if (!resp.success) error(resp.message ?: "未读数加载失败")
        _unreadChat.value = resp.chat.mapNotNull { (k, v) -> k.toIntOrNull()?.let { it to v } }.toMap()
        _unreadForum.value = resp.forum.mapNotNull { (k, v) -> k.toIntOrNull()?.let { it to v } }.toMap()
    }

    suspend fun loadForumSection(sectionId: Int): Result<ForumSectionDetailResponse> = runCatching {
        val resp = api.forumSection(sectionId)
        if (!resp.success) error(resp.message ?: "论坛分区加载失败")
        resp
    }

    suspend fun loadForumThread(threadId: Int): Result<ForumThreadDetailResponse> = runCatching {
        val resp = api.forumThread(threadId)
        if (!resp.success) error(resp.message ?: "论坛主题加载失败")
        resp
    }

    suspend fun createForumThread(sectionId: Int, title: String, content: String): Result<Unit> = runCatching {
        val resp = api.createForumThread(sectionId = sectionId, title = title, content = content)
        if (!resp.success) error(resp.message ?: "发帖失败")
    }

    suspend fun createForumReply(threadId: Int, content: String): Result<Unit> = runCatching {
        val resp = api.createForumReply(threadId = threadId, content = content)
        if (!resp.success) error(resp.message ?: "回帖失败")
    }

    suspend fun deleteForumReply(replyId: Int): Result<Unit> = runCatching {
        val resp = api.deleteForumReply(replyId)
        if (!resp.success) error(resp.message ?: "删回复失败")
    }

    suspend fun deleteForumThread(threadId: Int): Result<Unit> = runCatching {
        val resp = api.deleteForumThread(threadId)
        if (!resp.success) error(resp.message ?: "删帖失败")
    }

    suspend fun loadFollowing(): Result<List<UserDto>> = runCatching {
        val resp = api.following()
        if (!resp.success) error("关注列表加载失败")
        _following.value = resp.following
        resp.following
    }

    suspend fun toggleFollow(userId: Int): Result<String> = runCatching {
        val resp = api.toggleFollow(FollowToggleRequest(user_id = userId))
        if (!resp.success) error(resp.message ?: "关注操作失败")
        loadFollowing()
        resp.action ?: ""
    }

    suspend fun loadUploadQuota(): Result<UploadQuotaData> = runCatching {
        val resp = api.uploadQuota()
        val quota = resp.quota ?: error("上传配额加载失败")
        _uploadQuota.value = quota
        quota
    }

    suspend fun loadUploads(): Result<List<UploadedFileItem>> = runCatching {
        val resp = api.uploadedFiles()
        if (!resp.success) error(resp.message ?: "上传列表加载失败")
        _uploads.value = resp.images
        resp.images
    }

    suspend fun uploadImage(file: File): Result<Unit> = runCatching {
        val body = file.asRequestBody("application/octet-stream".toMediaTypeOrNull())
        val part = MultipartBody.Part.createFormData("file", file.name, body)
        val resp = api.uploadImage(part)
        if (!resp.success) error(resp.message ?: "上传图片失败")
        loadUploads()
        loadUploadQuota()
    }

    suspend fun uploadFile(file: File): Result<Unit> = runCatching {
        val body = file.asRequestBody("application/octet-stream".toMediaTypeOrNull())
        val part = MultipartBody.Part.createFormData("file", file.name, body)
        val resp = api.uploadFile(part)
        if (!resp.success) error(resp.message ?: "上传文件失败")
        loadUploads()
        loadUploadQuota()
    }

    suspend fun deleteUploaded(imageId: Int): Result<Unit> = runCatching {
        val resp = api.deleteUploaded(imageId)
        if (!resp.success) error(resp.message ?: "删除上传失败")
        loadUploads()
        loadUploadQuota()
    }

    suspend fun loadNotifications(): Result<List<MobileNotificationDto>> = runCatching {
        val resp = api.notifications()
        if (!resp.success) error("通知加载失败")
        _notifications.value = resp.notifications
        resp.notifications
    }

    suspend fun markNotificationRead(id: Int): Result<Unit> = runCatching {
        val resp = api.markNotificationRead(id)
        if (!resp.success) error(resp.message ?: "标记失败")
        loadNotifications()
    }

    suspend fun markAllNotificationRead(): Result<Unit> = runCatching {
        val resp = api.markAllNotificationsRead()
        if (!resp.success) error(resp.message ?: "标记失败")
        loadNotifications()
    }

    suspend fun registerPushToken(token: String, deviceId: String = ""): Result<Unit> = runCatching {
        val resp = api.registerPushToken(PushTokenRequest(token = token, device_id = deviceId))
        if (!resp.success) error(resp.message ?: "推送注册失败")
    }

    suspend fun unregisterPushToken(token: String, deviceId: String = ""): Result<Unit> = runCatching {
        val resp = api.unregisterPushToken(PushTokenRequest(token = token, device_id = deviceId))
        if (!resp.success) error(resp.message ?: "推送注销失败")
    }

    fun connectSocket(currentRoomId: Int?) {
        socketManager.connect(
            baseUrl = BuildConfig.BASE_URL,
            onMessage = { obj -> onSocketMessage(obj) },
            onDeleted = { obj -> onSocketDelete(obj) },
            onOnlineUsers = { obj -> onSocketOnlineUsers(obj) },
            onFollowOnline = { obj -> onSocketFollowOnline(obj) },
            onNotification = { obj -> onSocketNotification(obj) },
        )
        if (currentRoomId != null) socketManager.joinRoom(currentRoomId)
    }

    private fun onSocketMessage(obj: JSONObject) {
        val roomId = obj.optInt("room_id", 0)
        if (roomId <= 0) return
        val msg = ChatMessageDto(
            id = obj.optInt("id"),
            content = obj.optString("content", ""),
            timestamp = obj.optString("timestamp", ""),
            user_id = obj.optInt("user_id"),
            username = obj.optString("username", ""),
            nickname = obj.optString("nickname", ""),
            color = obj.optString("color", ""),
            badge = obj.optString("badge", ""),
        )
        val current = _chatMessages.value[roomId].orEmpty()
        if (current.any { it.id == msg.id }) return
        _chatMessages.value = _chatMessages.value.toMutableMap().apply { put(roomId, current + msg) }
    }

    private fun onSocketDelete(obj: JSONObject) {
        val roomId = obj.optInt("room_id", 0)
        val messageId = obj.optInt("id", obj.optInt("message_id", 0))
        if (roomId <= 0 || messageId <= 0) return
        val current = _chatMessages.value[roomId].orEmpty()
        _chatMessages.value = _chatMessages.value.toMutableMap().apply {
            put(roomId, current.filterNot { it.id == messageId })
        }
    }

    private fun onSocketOnlineUsers(obj: JSONObject) {
        val usersArr = obj.optJSONArray("users") ?: return
        val users = mutableListOf<UserDto>()
        for (i in 0 until usersArr.length()) {
            val it = usersArr.optJSONObject(i) ?: continue
            users.add(
                UserDto(
                    id = it.optInt("id"),
                    username = it.optString("username", ""),
                    nickname = it.optString("nickname", ""),
                    color = it.optString("color", ""),
                    badge = it.optString("badge", ""),
                )
            )
        }
        _onlineUsers.value = users
    }

    private fun onSocketFollowOnline(obj: JSONObject) {
        val body = "${obj.optString("nickname", obj.optString("username", ""))} 已上线"
        val item = MobileNotificationDto(
            id = System.currentTimeMillis().toInt(),
            type = "follow_online",
            title = "关注用户上线",
            body = body,
            created_at = "",
        )
        _notifications.value = listOf(item) + _notifications.value
    }

    private fun onSocketNotification(obj: JSONObject) {
        val item = MobileNotificationDto(
            id = obj.optInt("id", System.currentTimeMillis().toInt()),
            type = obj.optString("type", "system"),
            title = obj.optString("title", "系统通知"),
            body = obj.optString("body", ""),
            created_at = obj.optString("created_at", ""),
        )
        _notifications.value = listOf(item) + _notifications.value
    }

    fun joinRoom(roomId: Int) = socketManager.joinRoom(roomId)
    fun leaveRoom(roomId: Int) = socketManager.leaveRoom(roomId)
    fun sendMessageRealtime(roomId: Int, text: String, clientId: String? = null) =
        socketManager.sendMessage(roomId, text, clientId)

    fun deleteMessageRealtime(roomId: Int, messageId: Int) = socketManager.deleteMessage(roomId, messageId)

    fun disconnectSocket() = socketManager.disconnect()
}
