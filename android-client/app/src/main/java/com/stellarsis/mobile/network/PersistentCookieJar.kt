package com.stellarsis.mobile.network

import android.content.Context
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl

class PersistentCookieJar(context: Context) : CookieJar {
    private val prefs = context.getSharedPreferences("stellarsis_cookies", Context.MODE_PRIVATE)

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        if (cookies.isEmpty()) return
        val hostKey = "cookie_${url.host}"
        val encoded = cookies.map { it.toString() }.toSet()
        prefs.edit().putStringSet(hostKey, encoded).apply()
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val hostKey = "cookie_${url.host}"
        val saved = prefs.getStringSet(hostKey, emptySet()) ?: emptySet()
        return saved.mapNotNull {
            runCatching { Cookie.parse(url, it) }.getOrNull()
        }
    }
}
