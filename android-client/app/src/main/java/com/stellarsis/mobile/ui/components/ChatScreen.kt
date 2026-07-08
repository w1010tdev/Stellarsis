package com.stellarsis.mobile.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.stellarsis.mobile.data.ChatMessageDto
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete

@Composable
fun ChatScreen(
    messages: List<ChatMessageDto>,
    onlineCount: Int,
    onSend: (String) -> Unit,
    onDelete: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    var text by remember { mutableStateOf("") }

    Column(modifier = modifier.fillMaxSize().padding(8.dp)) {
        Text("在线人数: $onlineCount", style = MaterialTheme.typography.labelLarge)
        LazyColumn(
            modifier = Modifier.weight(1f).fillMaxWidth().padding(top = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(messages, key = { it.id }) { msg ->
                Column {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(
                            text = msg.nickname ?: msg.username,
                            style = MaterialTheme.typography.labelMedium,
                        )
                        IconButton(onClick = { onDelete(msg.id) }) {
                            Icon(Icons.Default.Delete, contentDescription = "删除")
                        }
                    }
                    Text(msg.content, style = MaterialTheme.typography.bodyLarge)
                    HorizontalDivider(modifier = Modifier.padding(top = 6.dp))
                }
            }
        }
        Row(modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) {
            OutlinedTextField(
                value = text,
                onValueChange = { text = it },
                modifier = Modifier.weight(1f),
                label = { Text("输入消息 / 支持 @quote{ID}") },
            )
            TextButton(
                onClick = {
                    val send = text.trim()
                    if (send.isNotBlank()) {
                        onSend(send)
                        text = ""
                    }
                },
                modifier = Modifier.padding(start = 8.dp),
            ) {
                Text("发送")
            }
        }
    }
}
