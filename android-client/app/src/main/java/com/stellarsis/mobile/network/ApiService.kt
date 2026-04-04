package com.stellarsis.mobile.network

import com.stellarsis.mobile.data.*
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.HTTP
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Query
import retrofit2.http.Part
import okhttp3.MultipartBody

interface ApiService {
    @POST("/api/auth/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    @GET("/api/mobile/bootstrap")
    suspend fun bootstrap(): ApiEnvelope<BootstrapPayload>

    @GET("/api/chat/{roomId}/history")
    suspend fun chatHistory(
        @retrofit2.http.Path("roomId") roomId: Int,
        @Query("limit") limit: Int = 50,
        @Query("page") page: String = "last",
    ): ChatHistoryResponse

    @POST("/api/chat/send")
    suspend fun sendChat(@Body body: SendChatRequest): ApiEnvelope<Unit>

    @GET("/api/mobile/notifications")
    suspend fun notifications(
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0,
    ): NotificationsResponse

    @POST("/api/mobile/push/token")
    suspend fun registerPushToken(@Body body: PushTokenRequest): ApiEnvelope<Unit>

    @HTTP(method = "DELETE", path = "/api/mobile/push/token", hasBody = true)
    suspend fun unregisterPushToken(@Body body: PushTokenRequest): ApiEnvelope<Unit>

    @GET("/api/follow/following")
    suspend fun following(): FollowListResponse

    @GET("/api/upload/quota")
    suspend fun uploadQuota(): UploadQuotaResponse

    @Multipart
    @POST("/api/upload/image")
    suspend fun uploadImage(@Part file: MultipartBody.Part): ApiEnvelope<Unit>

    @Multipart
    @POST("/api/upload/file")
    suspend fun uploadFile(@Part file: MultipartBody.Part): ApiEnvelope<Unit>
}
