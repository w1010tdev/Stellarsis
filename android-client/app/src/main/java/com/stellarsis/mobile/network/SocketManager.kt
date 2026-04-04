package com.stellarsis.mobile.network

import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject

class SocketManager {
    private var socket: Socket? = null

    fun connect(baseUrl: String, onMessage: (JSONObject) -> Unit, onNotification: (JSONObject) -> Unit) {
        if (socket?.connected() == true) return
        val options = IO.Options.builder().setTransports(arrayOf("websocket")).build()
        socket = IO.socket(baseUrl, options).apply {
            on(Socket.EVENT_CONNECT) {}
            on("message") { args ->
                val obj = args.firstOrNull() as? JSONObject ?: return@on
                onMessage(obj)
            }
            on("mobile_notification") { args ->
                val obj = args.firstOrNull() as? JSONObject ?: return@on
                onNotification(obj)
            }
            connect()
        }
    }

    fun joinRoom(roomId: Int) {
        val data = JSONObject().put("room", roomId)
        socket?.emit("join", data)
    }

    fun sendMessage(roomId: Int, message: String) {
        val payload = JSONObject()
            .put("room_id", roomId)
            .put("message", message)
        socket?.emit("send_message", payload)
    }

    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
    }
}
