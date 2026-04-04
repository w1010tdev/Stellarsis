package com.stellarsis.mobile.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.stellarsis.mobile.data.BootstrapPayload
import com.stellarsis.mobile.data.ChatMessageDto
import com.stellarsis.mobile.data.MobileNotificationDto
import com.stellarsis.mobile.data.RoomDto
import com.stellarsis.mobile.data.StellarsisRepository
import com.stellarsis.mobile.data.UploadQuotaData
import com.stellarsis.mobile.data.UserDto
import com.stellarsis.mobile.network.NetworkModule
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class MainUiState(
    val loggedIn: Boolean = false,
    val loading: Boolean = false,
    val error: String? = null,
    val bootstrap: BootstrapPayload? = null,
    val selectedRoomId: Int? = null,
    val notifications: List<MobileNotificationDto> = emptyList(),
    val roomMessages: Map<Int, List<ChatMessageDto>> = emptyMap(),
    val following: List<UserDto> = emptyList(),
    val uploadQuota: UploadQuotaData? = null,
)

class MainViewModel(app: Application) : AndroidViewModel(app) {
    private val repo: StellarsisRepository

    private val _state = MutableStateFlow(MainUiState())
    val state: StateFlow<MainUiState> = _state.asStateFlow()

    init {
        NetworkModule.init(app)
        repo = StellarsisRepository(app)
        viewModelScope.launch {
            repo.notifications.collect { list ->
                _state.update { it.copy(notifications = list) }
            }
        }
        viewModelScope.launch {
            repo.chatMessages.collect { map ->
                _state.update { it.copy(roomMessages = map) }
            }
        }
        viewModelScope.launch {
            repo.following.collect { list ->
                _state.update { it.copy(following = list) }
            }
        }
        viewModelScope.launch {
            repo.uploadQuota.collect { quota ->
                _state.update { it.copy(uploadQuota = quota) }
            }
        }
    }

    fun login(username: String, password: String) {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            val result = repo.login(username, password)
            result.onSuccess { resp ->
                if (resp.success) {
                    _state.update { it.copy(loggedIn = true, loading = false) }
                    refreshBootstrap()
                    repo.connectSocket()
                    refreshNotifications()
                    refreshFollowing()
                    refreshUploadQuota()
                } else {
                    _state.update { it.copy(loading = false, error = resp.error ?: resp.message ?: "登录失败") }
                }
            }.onFailure { throwable ->
                _state.update { it.copy(loading = false, error = throwable.message ?: "登录异常") }
            }
        }
    }

    fun refreshBootstrap() {
        viewModelScope.launch {
            val result = repo.loadBootstrap()
            result.onSuccess { payload ->
                val firstRoom = payload.rooms.firstOrNull()?.id
                _state.update { st ->
                    st.copy(
                        bootstrap = payload,
                        selectedRoomId = st.selectedRoomId ?: firstRoom,
                    )
                }
                firstRoom?.let { repo.joinRoom(it) }
            }.onFailure {
                _state.update { st -> st.copy(error = it.message ?: "加载初始化数据失败") }
            }
        }
    }

    fun refreshNotifications() {
        viewModelScope.launch {
            repo.loadNotifications()
        }
    }

    fun refreshFollowing() {
        viewModelScope.launch {
            repo.loadFollowing()
        }
    }

    fun refreshUploadQuota() {
        viewModelScope.launch {
            repo.loadUploadQuota()
        }
    }

    fun selectRoom(room: RoomDto) {
        _state.update { it.copy(selectedRoomId = room.id) }
        repo.joinRoom(room.id)
    }

    fun sendMessage(text: String) {
        val roomId = state.value.selectedRoomId ?: return
        viewModelScope.launch {
            repo.sendMessage(roomId, text)
            repo.sendMessageRealtime(roomId, text)
            repo.loadRoomMessages(roomId)
        }
    }

    fun loadMessagesForSelectedRoom() {
        val roomId = state.value.selectedRoomId ?: return
        viewModelScope.launch {
            repo.loadRoomMessages(roomId)
        }
    }

    override fun onCleared() {
        super.onCleared()
        repo.disconnectSocket()
    }
}
