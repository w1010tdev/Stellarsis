package com.stellarsis.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import com.stellarsis.mobile.data.ForumSectionDetailResponse
import com.stellarsis.mobile.data.ForumSectionDto
import com.stellarsis.mobile.data.ForumThreadDetailResponse

@Composable
fun ForumScreen(
    sections: List<ForumSectionDto>,
    sectionDetail: ForumSectionDetailResponse?,
    threadDetail: ForumThreadDetailResponse?,
    onLoadSection: (Int) -> Unit,
    onLoadThread: (Int) -> Unit,
    onCreateThread: (Int, String, String) -> Unit,
    onCreateReply: (Int, String) -> Unit,
    onDeleteReply: (Int, Int) -> Unit,
    onDeleteThread: (Int, Int) -> Unit,
) {
    var title by remember { mutableStateOf("") }
    var content by remember { mutableStateOf("") }
    var replyText by remember { mutableStateOf("") }

    Row(modifier = Modifier.fillMaxSize().padding(8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        LazyColumn(modifier = Modifier.weight(0.9f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(sections, key = { it.id }) { section ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(section.name)
                        if (section.description.isNotBlank()) Text(section.description)
                        Button(onClick = { onLoadSection(section.id) }, modifier = Modifier.padding(top = 8.dp)) {
                            Text("进入分区")
                        }
                    }
                }
            }
        }

        Column(modifier = Modifier.weight(1.1f).fillMaxSize(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (sectionDetail?.section != null) {
                Text("分区: ${sectionDetail.section.name}")
                OutlinedTextField(value = title, onValueChange = { title = it }, label = { Text("主题标题") }, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = content, onValueChange = { content = it }, label = { Text("主题内容") }, modifier = Modifier.fillMaxWidth())
                Button(onClick = {
                    onCreateThread(sectionDetail.section.id, title, content)
                    title = ""
                    content = ""
                }) { Text("发主题") }

                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(sectionDetail.threads, key = { it.id }) { thread ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(thread.title)
                                Text(thread.content)
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Button(onClick = { onLoadThread(thread.id) }) { Text("查看") }
                                    Button(onClick = { onDeleteThread(thread.id, sectionDetail.section.id) }) { Text("删帖") }
                                }
                            }
                        }
                    }
                }
            }

            if (threadDetail?.thread != null) {
                Text("主题: ${threadDetail.thread.title}")
                OutlinedTextField(value = replyText, onValueChange = { replyText = it }, label = { Text("回复内容") }, modifier = Modifier.fillMaxWidth())
                Button(onClick = {
                    onCreateReply(threadDetail.thread.id, replyText)
                    replyText = ""
                }) { Text("回复") }
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(threadDetail.replies, key = { it.id }) { reply ->
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(reply.user?.nickname ?: reply.user?.username ?: "用户")
                                Text(reply.content)
                                Button(onClick = { onDeleteReply(reply.id, threadDetail.thread.id) }) { Text("删回复") }
                            }
                        }
                    }
                }
            }
        }
    }
}
