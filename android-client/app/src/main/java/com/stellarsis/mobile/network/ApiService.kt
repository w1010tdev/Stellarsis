package com.stellarsis.mobile.network

import com.stellarsis.mobile.data.*
import okhttp3.MultipartBody
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.HTTP
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.Part

interface ApiService {
    @POST("/api/auth/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    @GET("/logout")
    suspend fun logoutRaw(): retrofit2.Response<Unit>

    @GET("/api/mobile/bootstrap")
    suspend fun bootstrap(): ApiEnvelope<BootstrapPayload>

    @POST("/profile")
    suspend fun updateProfile(@Body body: ProfileUpdateRequest): ApiEnvelope<UserDto>

    @POST("/change_password")
    suspend fun changePassword(@Body body: ChangePasswordRequest): ApiEnvelope<Unit>

    @GET("/api/chat/{roomId}/history")
    suspend fun chatHistory(
        @Path("roomId") roomId: Int,
        @Query("limit") limit: Int = 50,
        @Query("page") page: String = "last",
    ): ChatHistoryResponse

    @POST("/api/chat/send")
    suspend fun sendChat(@Body body: SendChatRequest): ApiEnvelope<Unit>

    @DELETE("/api/chat/{roomId}/messages/{messageId}")
    suspend fun deleteChatMessage(
        @Path("roomId") roomId: Int,
        @Path("messageId") messageId: Int,
    ): ApiEnvelope<Unit>

    @GET("/api/chat/{roomId}/online_count")
    suspend fun onlineUsers(@Path("roomId") roomId: Int): OnlineUsersResponse

    @GET("/api/last_views/unread_counts")
    suspend fun unreadCounts(): UnreadCountsResponse

    @GET("/api/spa/forum/section/{sectionId}")
    suspend fun forumSection(@Path("sectionId") sectionId: Int): ForumSectionDetailResponse

    @GET("/api/spa/forum/thread/{threadId}")
    suspend fun forumThread(@Path("threadId") threadId: Int): ForumThreadDetailResponse

    @POST("/api/spa/forum/thread")
    suspend fun createForumThread(@Body body: Map<String, String>): ApiEnvelope<Unit>

    @POST("/api/forum/reply")
    suspend fun createForumReply(@Body body: Map<String, String>): ApiEnvelope<Unit>

    @DELETE("/api/forum/reply/{replyId}")
    suspend fun deleteForumReply(@Path("replyId") replyId: Int): ApiEnvelope<Unit>

    @DELETE("/api/forum/thread/{threadId}")
    suspend fun deleteForumThread(@Path("threadId") threadId: Int): ApiEnvelope<Unit>

    @GET("/api/follow/following")
    suspend fun following(): FollowListResponse

    @POST("/api/follow/toggle")
    suspend fun toggleFollow(@Body body: FollowToggleRequest): FollowToggleResponse

    @GET("/api/upload/quota")
    suspend fun uploadQuota(): UploadQuotaResponse

    @GET("/api/upload/images")
    suspend fun uploadedFiles(): UploadedFilesResponse

    @Multipart
    @POST("/api/upload/image")
    suspend fun uploadImage(@Part file: MultipartBody.Part): ApiEnvelope<Unit>

    @Multipart
    @POST("/api/upload/file")
    suspend fun uploadFile(@Part file: MultipartBody.Part): ApiEnvelope<Unit>

    @DELETE("/api/upload/image/{imageId}")
    suspend fun deleteUploaded(@Path("imageId") imageId: Int): ApiEnvelope<Unit>

    @GET("/api/mobile/notifications")
    suspend fun notifications(
        @Query("limit") limit: Int = 50,
        @Query("offset") offset: Int = 0,
    ): NotificationsResponse

    @POST("/api/mobile/notifications/{id}/read")
    suspend fun markNotificationRead(@Path("id") id: Int): ApiEnvelope<Unit>

    @POST("/api/mobile/notifications/read_all")
    suspend fun markAllNotificationsRead(): ApiEnvelope<Unit>

    @POST("/api/mobile/push/token")
    suspend fun registerPushToken(@Body body: PushTokenRequest): ApiEnvelope<Unit>

    @HTTP(method = "DELETE", path = "/api/mobile/push/token", hasBody = true)
    suspend fun unregisterPushToken(@Body body: PushTokenRequest): ApiEnvelope<Unit>
}
