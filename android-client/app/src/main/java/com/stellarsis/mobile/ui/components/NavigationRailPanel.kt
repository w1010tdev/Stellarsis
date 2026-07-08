package com.stellarsis.mobile.ui.components

import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Forum
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun NavigationRailPanel(
    selectedIndex: Int,
    onSelect: (Int) -> Unit,
) {
    val items = listOf("聊天", "论坛", "通知", "设置")
    val icons = listOf(Icons.Default.Chat, Icons.Default.Forum, Icons.Default.Notifications, Icons.Default.Settings)
    NavigationRail(modifier = Modifier.fillMaxHeight().width(80.dp)) {
        items.forEachIndexed { index, title ->
            NavigationRailItem(
                selected = selectedIndex == index,
                onClick = { onSelect(index) },
                icon = { Icon(icons[index], contentDescription = title) },
                label = { Text(title) },
            )
        }
    }
}
