package com.stellarsis.mobile.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.windowsizeclass.WindowWidthSizeClass
import androidx.compose.material3.windowsizeclass.WindowSizeClass
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.stellarsis.mobile.ui.components.ChatScreen
import com.stellarsis.mobile.ui.components.LoginScreen
import com.stellarsis.mobile.ui.components.NavigationRailPanel
import com.stellarsis.mobile.ui.screens.ForumScreen
import com.stellarsis.mobile.ui.screens.NotificationsScreen
import com.stellarsis.mobile.ui.screens.SettingsScreen
import com.stellarsis.mobile.viewmodel.MainViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StellarsisApp(
    windowSizeClass: WindowSizeClass,
    mainViewModel: MainViewModel,
) {
    val state by mainViewModel.state.collectAsState()

    if (!state.loggedIn) {
        LoginScreen(
            loading = state.loading,
            error = state.error,
            onLogin = mainViewModel::login,
        )
        return
    }

    LaunchedEffect(state.selectedRoomId) {
        mainViewModel.loadMessagesForSelectedRoom()
    }

    val isTablet = windowSizeClass.widthSizeClass != WindowWidthSizeClass.Compact
    var navIndex by remember { mutableIntStateOf(0) }

    if (isTablet) {
        Scaffold(
            topBar = { TopAppBar(title = { Text("Stellarsis") }) }
        ) { padding ->
            Row(modifier = Modifier.fillMaxSize().padding(padding)) {
                NavigationRailPanel(selectedIndex = navIndex, onSelect = { navIndex = it })
                Column(modifier = Modifier.weight(1f).fillMaxSize().padding(8.dp)) {
                    MainContent(
                        navIndex = navIndex,
                        state = state,
                        onSend = mainViewModel::sendMessage,
                    )
                }
            }
        }
    } else {
        Scaffold(
            topBar = { TopAppBar(title = { Text("Stellarsis") }) },
            bottomBar = {
                NavigationBar {
                    listOf("聊天", "论坛", "通知", "设置").forEachIndexed { i, label ->
                        NavigationBarItem(
                            selected = navIndex == i,
                            onClick = { navIndex = i },
                            icon = { Text(if (navIndex == i) "●" else "○") },
                            label = { Text(label) },
                        )
                    }
                }
            }
        ) { padding ->
            Column(modifier = Modifier.fillMaxSize().padding(padding).padding(8.dp)) {
                MainContent(
                    navIndex = navIndex,
                    state = state,
                    onSend = mainViewModel::sendMessage,
                )
            }
        }
    }
}

@Composable
private fun MainContent(
    navIndex: Int,
    state: com.stellarsis.mobile.viewmodel.MainUiState,
    onSend: (String) -> Unit,
) {
    when (navIndex) {
        0 -> {
            val roomId = state.selectedRoomId
            val messages = if (roomId == null) emptyList() else state.roomMessages[roomId].orEmpty()
            ChatScreen(
                messages = messages,
                onSend = onSend,
                modifier = Modifier.fillMaxWidth().fillMaxSize(),
            )
        }
        1 -> ForumScreen(state.bootstrap?.sections ?: emptyList())
        2 -> NotificationsScreen(state.notifications)
        else -> SettingsScreen(
            user = state.bootstrap?.user,
            uploadQuota = state.uploadQuota,
        )
    }
}
