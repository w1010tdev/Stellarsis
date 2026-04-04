package com.stellarsis.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.stellarsis.mobile.data.MobileNotificationDto

@Composable
fun NotificationsScreen(itemsData: List<MobileNotificationDto>) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(itemsData, key = { it.id }) { n ->
            Card {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(n.title, style = MaterialTheme.typography.titleMedium)
                    Text(n.body, style = MaterialTheme.typography.bodyMedium)
                    Text(n.created_at, style = MaterialTheme.typography.labelSmall)
                }
            }
        }
    }
}
