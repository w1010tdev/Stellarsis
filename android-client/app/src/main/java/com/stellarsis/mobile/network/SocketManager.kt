package com.stellarsis.mobile.network

import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject

class SocketManager {
    private var socket: Socket? = null

    fun connect(
        baseUrl: String,
        onMessage: (JSONObject) -> Unit,
        onDeleted: (JSONObject) -> Unit,
        onOnlineUsers: (JSONObject) -> Unit,
        onFollowOnline: (JSONObject) -> Unit,
        onNotification: (JSONObject) -> Unit,
    ) {
        if (socket?.connected() == true) return
        val options = IO.Options.builder().setTransports(arrayOf("websocket", "polling")).build()
        socket = IO.socket(baseUrl, options).apply {
            on("message") { args -> (args.firstOrNull() as? JSONObject)?.let(onMessage) }
            on("message_deleted") { args -> (args.firstOrNull() as? JSONObject)?.let(onDeleted) }
            on("online_users") { args -> (args.firstOrNull() as? JSONObject)?.let(onOnlineUsers) }
            on("followed_user_online") { args -> (args.firstOrNull() as? JSONObject)?.let(onFollowOnline) }
            on("mobile_notification") { args -> (args.firstOrNull() as? JSONObject)?.let(onNotification) }
            connect()
        }
    }

    fun joinRoom(roomId: Int) {
        socket?.emit("join", JSONObject().put("room", roomId))
    }

    fun leaveRoom(roomId: Int) {
        socket?.emit("leave", JSONObject().put("room", roomId))
    }

    fun sendMessage(roomId: Int, message: String, clientId: String? = null) {
        val payload = JSONObject()
            .put("room_id", roomId)
            .put("message", message)
        if (!clientId.isNullOrBlank()) payload.put("client_id", clientId)
        socket?.emit("send_message", payload)
    }

    fun deleteMessage(roomId: Int, messageId: Int) {
        val payload = JSONObject().put("room_id", roomId).put("message_id", messageId)
        socket?.emit("delete_message", payload)
    }

    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
    }
}
