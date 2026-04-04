package com.stellarsis.mobile.data

import android.content.Context
import com.stellarsis.mobile.BuildConfig
import com.stellarsis.mobile.network.NetworkModule
import com.stellarsis.mobile.network.SocketManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
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

    suspend fun login(username: String, password: String): Result<LoginResponse> = runCatching {
        api.login(LoginRequest(username, password))
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

    suspend fun loadNotifications(): Result<List<MobileNotificationDto>> = runCatching {
        val resp = api.notifications()
        if (!resp.success) error("通知加载失败")
        _notifications.value = resp.notifications
        resp.notifications
    }

    suspend fun loadFollowing(): Result<List<UserDto>> = runCatching {
        val resp = api.following()
        if (!resp.success) error("关注列表加载失败")
        _following.value = resp.following
        resp.following
    }

    suspend fun loadUploadQuota(): Result<UploadQuotaData> = runCatching {
        val resp = api.uploadQuota()
        val quota = resp.quota ?: error("上传配额加载失败")
        _uploadQuota.value = quota
        quota
    }

    suspend fun uploadImage(file: File): Result<Unit> = runCatching {
        val body = file.asRequestBody("application/octet-stream".toMediaTypeOrNull())
        val part = MultipartBody.Part.createFormData("file", file.name, body)
        val resp = api.uploadImage(part)
        if (!resp.success) error(resp.message ?: "上传图片失败")
    }

    suspend fun uploadFile(file: File): Result<Unit> = runCatching {
        val body = file.asRequestBody("application/octet-stream".toMediaTypeOrNull())
        val part = MultipartBody.Part.createFormData("file", file.name, body)
        val resp = api.uploadFile(part)
        if (!resp.success) error(resp.message ?: "上传文件失败")
    }

    fun connectSocket() {
        socketManager.connect(
            baseUrl = BuildConfig.BASE_URL,
            onMessage = { obj ->
                val roomId = obj.optInt("room_id", 0)
                if (roomId <= 0) return@connect
            },
            onNotification = {
                loadNotificationFromSocket(it)
            }
        )
    }

    private fun loadNotificationFromSocket(obj: org.json.JSONObject) {
        val item = MobileNotificationDto(
            id = obj.optInt("id"),
            type = obj.optString("type", "system"),
            title = obj.optString("title", "系统通知"),
            body = obj.optString("body", ""),
            created_at = obj.optString("created_at", ""),
        )
        _notifications.value = listOf(item) + _notifications.value
    }

    fun joinRoom(roomId: Int) = socketManager.joinRoom(roomId)
    fun sendMessageRealtime(roomId: Int, text: String) = socketManager.sendMessage(roomId, text)
    fun disconnectSocket() = socketManager.disconnect()
}
