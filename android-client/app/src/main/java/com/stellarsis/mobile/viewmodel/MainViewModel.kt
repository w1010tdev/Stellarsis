package com.stellarsis.mobile.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.stellarsis.mobile.data.BootstrapPayload
import com.stellarsis.mobile.data.ChatMessageDto
import com.stellarsis.mobile.data.ForumSectionDetailResponse
import com.stellarsis.mobile.data.ForumThreadDetailResponse
import com.stellarsis.mobile.data.MobileNotificationDto
import com.stellarsis.mobile.data.RoomDto
import com.stellarsis.mobile.data.StellarsisRepository
import com.stellarsis.mobile.data.UploadQuotaData
import com.stellarsis.mobile.data.UploadedFileItem
import com.stellarsis.mobile.data.UserDto
import com.stellarsis.mobile.network.NetworkModule
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.File

data class MainUiState(
    val loggedIn: Boolean = false,
    val loading: Boolean = false,
    val error: String? = null,
    val info: String? = null,
    val bootstrap: BootstrapPayload? = null,
    val selectedRoomId: Int? = null,
    val notifications: List<MobileNotificationDto> = emptyList(),
    val roomMessages: Map<Int, List<ChatMessageDto>> = emptyMap(),
    val following: List<UserDto> = emptyList(),
    val uploadQuota: UploadQuotaData? = null,
    val uploads: List<UploadedFileItem> = emptyList(),
    val onlineUsers: List<UserDto> = emptyList(),
    val unreadChat: Map<Int, Int> = emptyMap(),
    val unreadForum: Map<Int, Int> = emptyMap(),
    val forumSectionDetail: ForumSectionDetailResponse? = null,
    val forumThreadDetail: ForumThreadDetailResponse? = null,
)

class MainViewModel(app: Application) : AndroidViewModel(app) {
    private val repo: StellarsisRepository

    private val _state = MutableStateFlow(MainUiState())
    val state: StateFlow<MainUiState> = _state.asStateFlow()

    init {
        NetworkModule.init(app)
        repo = StellarsisRepository(app)
        viewModelScope.launch { repo.notifications.collect { _state.update { s -> s.copy(notifications = it) } } }
        viewModelScope.launch { repo.chatMessages.collect { _state.update { s -> s.copy(roomMessages = it) } } }
        viewModelScope.launch { repo.following.collect { _state.update { s -> s.copy(following = it) } } }
        viewModelScope.launch { repo.uploadQuota.collect { _state.update { s -> s.copy(uploadQuota = it) } } }
        viewModelScope.launch { repo.uploads.collect { _state.update { s -> s.copy(uploads = it) } } }
        viewModelScope.launch { repo.onlineUsers.collect { _state.update { s -> s.copy(onlineUsers = it) } } }
        viewModelScope.launch { repo.unreadChat.collect { _state.update { s -> s.copy(unreadChat = it) } } }
        viewModelScope.launch { repo.unreadForum.collect { _state.update { s -> s.copy(unreadForum = it) } } }
    }

    fun clearError() = _state.update { it.copy(error = null) }
    fun clearInfo() = _state.update { it.copy(info = null) }

    fun login(username: String, password: String) {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            repo.login(username, password)
                .onSuccess { resp ->
                    if (resp.success) {
                        _state.update { it.copy(loggedIn = true, loading = false) }
                        refreshAll()
                    } else {
                        _state.update { it.copy(loading = false, error = resp.error ?: resp.message ?: "登录失败") }
                    }
                }
                .onFailure { t ->
                    _state.update { it.copy(loading = false, error = t.message ?: "登录异常") }
                }
        }
    }

    fun logout() {
        viewModelScope.launch {
            repo.logout()
            repo.disconnectSocket()
            _state.value = MainUiState()
        }
    }

    fun refreshAll() {
        refreshBootstrap()
        refreshNotifications()
        refreshFollowing()
        refreshUploadQuota()
        refreshUploads()
        refreshUnreadCounts()
    }

    fun refreshBootstrap() {
        viewModelScope.launch {
            repo.loadBootstrap()
                .onSuccess { payload ->
                    val selected = _state.value.selectedRoomId ?: payload.rooms.firstOrNull()?.id
                    _state.update { s -> s.copy(bootstrap = payload, selectedRoomId = selected, error = null) }
                    repo.connectSocket(selected)
                    selected?.let {
                        repo.joinRoom(it)
                        repo.loadRoomMessages(it)
                        repo.loadOnlineUsers(it)
                    }
                }
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "加载初始化数据失败") } }
        }
    }

    fun refreshNotifications() = viewModelScope.launch { repo.loadNotifications() }
    fun refreshFollowing() = viewModelScope.launch { repo.loadFollowing() }
    fun refreshUploadQuota() = viewModelScope.launch { repo.loadUploadQuota() }
    fun refreshUploads() = viewModelScope.launch { repo.loadUploads() }
    fun refreshUnreadCounts() = viewModelScope.launch { repo.loadUnreadCounts() }

    fun selectRoom(room: RoomDto) {
        val prev = _state.value.selectedRoomId
        if (prev != null && prev != room.id) repo.leaveRoom(prev)
        _state.update { it.copy(selectedRoomId = room.id) }
        repo.joinRoom(room.id)
        loadMessagesForSelectedRoom()
        loadOnlineUsersForSelectedRoom()
    }

    fun loadMessagesForSelectedRoom() {
        val roomId = state.value.selectedRoomId ?: return
        viewModelScope.launch {
            repo.loadRoomMessages(roomId)
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "加载消息失败") } }
        }
    }

    fun loadOnlineUsersForSelectedRoom() {
        val roomId = state.value.selectedRoomId ?: return
        viewModelScope.launch {
            repo.loadOnlineUsers(roomId)
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "加载在线用户失败") } }
        }
    }

    fun sendMessage(text: String) {
        val roomId = state.value.selectedRoomId ?: return
        viewModelScope.launch {
            repo.sendMessage(roomId, text)
                .onSuccess {
                    repo.sendMessageRealtime(roomId, text)
                    repo.loadRoomMessages(roomId)
                    repo.loadUnreadCounts()
                }
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "发送失败") } }
        }
    }

    fun deleteChatMessage(messageId: Int) {
        val roomId = state.value.selectedRoomId ?: return
        viewModelScope.launch {
            repo.deleteMessage(roomId, messageId)
                .onSuccess {
                    repo.deleteMessageRealtime(roomId, messageId)
                    repo.loadRoomMessages(roomId)
                }
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "删除失败") } }
        }
    }

    fun loadForumSection(sectionId: Int) {
        viewModelScope.launch {
            repo.loadForumSection(sectionId)
                .onSuccess { _state.update { s -> s.copy(forumSectionDetail = it, error = null) } }
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "论坛分区加载失败") } }
        }
    }

    fun loadForumThread(threadId: Int) {
        viewModelScope.launch {
            repo.loadForumThread(threadId)
                .onSuccess { _state.update { s -> s.copy(forumThreadDetail = it, error = null) } }
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "论坛主题加载失败") } }
        }
    }

    fun createForumThread(sectionId: Int, title: String, content: String) {
        viewModelScope.launch {
            repo.createForumThread(sectionId, title, content)
                .onSuccess {
                    _state.update { it.copy(info = "发帖成功") }
                    loadForumSection(sectionId)
                    refreshUnreadCounts()
                }
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "发帖失败") } }
        }
    }

    fun createForumReply(threadId: Int, content: String) {
        viewModelScope.launch {
            repo.createForumReply(threadId, content)
                .onSuccess {
                    _state.update { it.copy(info = "回帖成功") }
                    loadForumThread(threadId)
                    refreshUnreadCounts()
                }
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "回帖失败") } }
        }
    }

    fun deleteForumReply(replyId: Int, threadId: Int) {
        viewModelScope.launch {
            repo.deleteForumReply(replyId)
                .onSuccess {
                    _state.update { it.copy(info = "回复已删除") }
                    loadForumThread(threadId)
                }
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "删除回复失败") } }
        }
    }

    fun deleteForumThread(threadId: Int, sectionId: Int) {
        viewModelScope.launch {
            repo.deleteForumThread(threadId)
                .onSuccess {
                    _state.update { it.copy(info = "主题已删除") }
                    loadForumSection(sectionId)
                }
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "删帖失败") } }
        }
    }

    fun toggleFollow(userId: Int) {
        viewModelScope.launch {
            repo.toggleFollow(userId)
                .onSuccess { action ->
                    _state.update { it.copy(info = if (action == "follow") "关注成功" else "已取消关注") }
                }
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "关注操作失败") } }
        }
    }

    fun uploadImage(file: File) {
        viewModelScope.launch {
            repo.uploadImage(file)
                .onSuccess { _state.update { it.copy(info = "图片上传成功") } }
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "图片上传失败") } }
        }
    }

    fun uploadFile(file: File) {
        viewModelScope.launch {
            repo.uploadFile(file)
                .onSuccess { _state.update { it.copy(info = "文件上传成功") } }
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "文件上传失败") } }
        }
    }

    fun deleteUploaded(imageId: Int) {
        viewModelScope.launch {
            repo.deleteUploaded(imageId)
                .onSuccess { _state.update { it.copy(info = "删除上传成功") } }
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "删除上传失败") } }
        }
    }

    fun markNotificationRead(id: Int) {
        viewModelScope.launch {
            repo.markNotificationRead(id)
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "标记通知失败") } }
        }
    }

    fun markAllNotificationsRead() {
        viewModelScope.launch {
            repo.markAllNotificationRead()
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "标记通知失败") } }
        }
    }

    fun updateProfile(nickname: String?, color: String?, badge: String?) {
        viewModelScope.launch {
            repo.updateProfile(nickname, color, badge)
                .onSuccess {
                    _state.update { it.copy(info = "资料更新成功") }
                    refreshBootstrap()
                }
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "资料更新失败") } }
        }
    }

    fun changePassword(old: String, new: String, confirm: String) {
        viewModelScope.launch {
            repo.changePassword(old, new, confirm)
                .onSuccess { _state.update { it.copy(info = "密码修改成功") } }
                .onFailure { _state.update { s -> s.copy(error = it.message ?: "密码修改失败") } }
        }
    }

    override fun onCleared() {
        super.onCleared()
        repo.disconnectSocket()
    }
}
