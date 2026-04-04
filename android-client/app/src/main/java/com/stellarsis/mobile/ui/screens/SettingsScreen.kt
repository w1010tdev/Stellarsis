package com.stellarsis.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.stellarsis.mobile.data.UploadQuotaData
import com.stellarsis.mobile.data.UploadedFileItem
import com.stellarsis.mobile.data.UserDto

@Composable
fun SettingsScreen(
    user: UserDto?,
    uploadQuota: UploadQuotaData?,
    following: List<UserDto>,
    uploads: List<UploadedFileItem>,
    onToggleFollow: (Int) -> Unit,
    onDeleteUploaded: (Int) -> Unit,
    onUpdateProfile: (String?, String?, String?) -> Unit,
    onChangePassword: (String, String, String) -> Unit,
    onLogout: () -> Unit,
) {
    var nickname by remember { mutableStateOf(user?.nickname ?: "") }
    var color by remember { mutableStateOf(user?.color ?: "#000000") }
    var badge by remember { mutableStateOf(user?.badge ?: "") }
    var oldPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("个人资料")
                Text("账号: ${user?.username ?: "-"}")
                OutlinedTextField(value = nickname, onValueChange = { nickname = it }, label = { Text("昵称") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = color, onValueChange = { color = it }, label = { Text("颜色 #RRGGBB") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = badge, onValueChange = { badge = it }, label = { Text("徽章") }, modifier = Modifier.fillMaxWidth())
                Button(onClick = { onUpdateProfile(nickname, color, badge) }) { Text("保存资料") }
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("修改密码")
                OutlinedTextField(value = oldPassword, onValueChange = { oldPassword = it }, label = { Text("旧密码") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = newPassword, onValueChange = { newPassword = it }, label = { Text("新密码") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = confirmPassword, onValueChange = { confirmPassword = it }, label = { Text("确认新密码") }, modifier = Modifier.fillMaxWidth())
                Button(onClick = { onChangePassword(oldPassword, newPassword, confirmPassword) }) { Text("修改密码") }
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("上传配额")
                Text(
                    if (uploadQuota == null) "-"
                    else if (uploadQuota.is_admin) "管理员无限制"
                    else "${uploadQuota.used}/${uploadQuota.total} (${String.format("%.1f", uploadQuota.percent)}%)"
                )
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("关注列表")
                LazyColumn(verticalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                    items(following, key = { it.id }) { f ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(8.dp)) {
                                Text(f.nickname ?: f.username)
                                Button(onClick = { onToggleFollow(f.id) }) { Text("取关") }
                            }
                        }
                    }
                }
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("已上传文件")
                LazyColumn(verticalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                    items(uploads, key = { it.id }) { up ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(8.dp)) {
                                Text(up.filename)
                                Button(onClick = { onDeleteUploaded(up.id) }) { Text("删除") }
                            }
                        }
                    }
                }
            }
        }

        Button(onClick = onLogout, modifier = Modifier.fillMaxWidth()) { Text("登出") }
    }
}
