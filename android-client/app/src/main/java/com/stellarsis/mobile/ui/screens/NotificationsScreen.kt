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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.stellarsis.mobile.data.MobileNotificationDto

@Composable
fun NotificationsScreen(
    itemsData: List<MobileNotificationDto>,
    onRead: (Int) -> Unit,
    onReadAll: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize().padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Button(onClick = onReadAll, modifier = Modifier.fillMaxWidth()) { Text("全部已读") }
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(itemsData, key = { it.id }) { n ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(n.title, style = MaterialTheme.typography.titleMedium)
                        Text(n.body, style = MaterialTheme.typography.bodyMedium)
                        Text(n.created_at, style = MaterialTheme.typography.labelSmall)
                        Button(onClick = { onRead(n.id) }) { Text("标记已读") }
                    }
                }
            }
        }
    }
}
