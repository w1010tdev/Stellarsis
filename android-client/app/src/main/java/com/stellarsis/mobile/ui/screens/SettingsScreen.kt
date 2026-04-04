package com.stellarsis.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.stellarsis.mobile.data.UploadQuotaData
import com.stellarsis.mobile.data.UserDto

@Composable
fun SettingsScreen(
    user: UserDto?,
    uploadQuota: UploadQuotaData?,
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Card(modifier = Modifier.padding(4.dp)) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("账号")
                Text(user?.username ?: "-")
            }
        }
        Card(modifier = Modifier.padding(4.dp)) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("昵称")
                Text(user?.nickname ?: "未设置")
            }
        }
        Card(modifier = Modifier.padding(4.dp)) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text("上传配额")
                Text(
                    if (uploadQuota == null) "-"
                    else if (uploadQuota.is_admin) "管理员无限制"
                    else "${uploadQuota.used}/${uploadQuota.total} (${uploadQuota.percent.toInt()}%)"
                )
            }
        }
    }
}
