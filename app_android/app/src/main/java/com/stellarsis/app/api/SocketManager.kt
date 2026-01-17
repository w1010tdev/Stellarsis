package com.stellarsis.app.api

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import org.json.JSONObject
import java.net.URISyntaxException

/**
 * Socket.IO 管理器
 * 用于实时消息推送
 */
class SocketManager private constructor() {
    
    companion object {
        private const val TAG = "SocketManager"
        private const val RECONNECTION_ATTEMPTS = 5
        private const val RECONNECTION_DELAY = 1000L
        
        @Volatile
        private var instance: SocketManager? = null
        
        fun getInstance(): SocketManager {
            return instance ?: synchronized(this) {
                instance ?: SocketManager().also { instance = it }
            }
        }
    }
    
    private var socket: Socket? = null
    private var token: String? = null
    private var isConnected = false
    
    // 回调接口
    var onUnreadNotifications: ((total: Int, chatCount: Int, forumCount: Int) -> Unit)? = null
    var onConnectionChanged: ((connected: Boolean) -> Unit)? = null
    var onAuthError: (() -> Unit)? = null
    
    /**
     * 连接到服务器
     */
    fun connect(serverUrl: String, token: String) {
        this.token = token
        
        try {
            // 配置 Socket.IO 选项
            val options = IO.Options().apply {
                transports = arrayOf("websocket", "polling")
                query = "token=$token"
                reconnection = true
                reconnectionAttempts = RECONNECTION_ATTEMPTS
                reconnectionDelay = RECONNECTION_DELAY
            }
            
            socket = IO.socket(serverUrl, options)
            
            // 设置事件监听器
            setupEventListeners()
            
            // 连接
            socket?.connect()
            
        } catch (e: URISyntaxException) {
            Log.e(TAG, "Socket URL 错误: ${e.message}")
        }
    }
    
    /**
     * 断开连接
     */
    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
        isConnected = false
    }
    
    /**
     * 请求未读消息
     */
    fun requestUnreadNotifications() {
        if (isConnected && token != null) {
            val data = JSONObject().apply {
                put("token", token)
            }
            socket?.emit("get_unread_notifications", data)
        }
    }
    
    /**
     * 发送心跳
     */
    fun sendHeartbeat() {
        if (isConnected) {
            socket?.emit("heartbeat")
        }
    }
    
    /**
     * 设置事件监听器
     */
    private fun setupEventListeners() {
        // 连接成功
        socket?.on(Socket.EVENT_CONNECT) {
            Log.d(TAG, "Socket 已连接")
            isConnected = true
            onConnectionChanged?.invoke(true)
            
            // 连接成功后请求未读消息
            requestUnreadNotifications()
        }
        
        // 断开连接
        socket?.on(Socket.EVENT_DISCONNECT) { args ->
            Log.d(TAG, "Socket 断开连接: ${args.firstOrNull()}")
            isConnected = false
            onConnectionChanged?.invoke(false)
        }
        
        // 连接错误
        socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
            Log.e(TAG, "Socket 连接错误: ${args.firstOrNull()}")
            isConnected = false
            onConnectionChanged?.invoke(false)
        }
        
        // 未读消息通知
        socket?.on("unread_notifications") { args ->
            try {
                val data = args[0] as JSONObject
                if (data.optBoolean("success", false)) {
                    val totalUnread = data.optInt("total_unread", 0)
                    
                    var chatCount = 0
                    var forumCount = 0
                    
                    val chatObj = data.optJSONObject("chat")
                    chatObj?.keys()?.forEach { key ->
                        val item = chatObj.optJSONObject(key)
                        chatCount += item?.optInt("count", 0) ?: 0
                    }
                    
                    val forumObj = data.optJSONObject("forum")
                    forumObj?.keys()?.forEach { key ->
                        val item = forumObj.optJSONObject(key)
                        forumCount += item?.optInt("count", 0) ?: 0
                    }
                    
                    Log.d(TAG, "未读消息: 总计=$totalUnread, 聊天=$chatCount, 论坛=$forumCount")
                    onUnreadNotifications?.invoke(totalUnread, chatCount, forumCount)
                }
            } catch (e: Exception) {
                Log.e(TAG, "解析未读消息失败: ${e.message}")
            }
        }
        
        // 新消息通知（用于实时更新）
        socket?.on("new_message_notification") {
            Log.d(TAG, "收到新消息通知")
            requestUnreadNotifications()
        }
        
        // 认证错误
        socket?.on("auth_error") { args ->
            Log.e(TAG, "认证错误: ${args.firstOrNull()}")
            onAuthError?.invoke()
        }
    }
    
    /**
     * 检查是否已连接
     */
    fun isConnected(): Boolean = isConnected
}
