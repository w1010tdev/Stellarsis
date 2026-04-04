package com.stellarsis.mobile.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.stellarsis.mobile.ui.components.ChatScreen
import com.stellarsis.mobile.ui.components.LoginScreen
import com.stellarsis.mobile.ui.components.NavigationRailPanel
import com.stellarsis.mobile.ui.screens.ForumScreen
import com.stellarsis.mobile.ui.screens.NotificationsScreen
import com.stellarsis.mobile.ui.screens.SettingsScreen
import com.stellarsis.mobile.ui.screens.UploadsScreen
import com.stellarsis.mobile.viewmodel.MainUiState
import com.stellarsis.mobile.viewmodel.MainViewModel
import kotlinx.coroutines.launch
import androidx.compose.material3.rememberDrawerState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu

private val navItems = listOf("聊天", "论坛", "通知", "上传", "设置")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StellarsisApp(
    windowSizeClass: WindowSizeClass,
    mainViewModel: MainViewModel,
) {
    val state by mainViewModel.state.collectAsState()
    val snackState = remember { SnackbarHostState() }

    LaunchedEffect(state.error, state.info) {
        state.error?.let { snackState.showSnackbar(it); mainViewModel.clearError() }
        state.info?.let { snackState.showSnackbar(it); mainViewModel.clearInfo() }
    }

    if (!state.loggedIn) {
        LoginScreen(loading = state.loading, error = state.error, onLogin = mainViewModel::login)
        return
    }

    LaunchedEffect(state.selectedRoomId) {
        mainViewModel.loadMessagesForSelectedRoom()
        mainViewModel.loadOnlineUsersForSelectedRoom()
    }

    val isTablet = windowSizeClass.widthSizeClass != WindowWidthSizeClass.Compact
    var navIndex by remember { mutableIntStateOf(0) }

    if (isTablet) {
        Scaffold(
            topBar = { TopAppBar(title = { Text("Stellarsis") }) },
            snackbarHost = { SnackbarHost(snackState) }
        ) { padding ->
            Row(modifier = Modifier.fillMaxSize().padding(padding)) {
                NavigationRailPanel(selectedIndex = navIndex, onSelect = { navIndex = it })
                Column(modifier = Modifier.weight(1f).fillMaxSize().padding(8.dp)) {
                    MainContent(navIndex, state, mainViewModel)
                }
            }
        }
    } else {
        val drawerState = rememberDrawerState(DrawerValue.Closed)
        val scope = rememberCoroutineScope()
        ModalNavigationDrawer(
            drawerState = drawerState,
            drawerContent = {
                ModalDrawerSheet {
                    navItems.forEachIndexed { i, t ->
                        NavigationDrawerItem(
                            label = { Text(t) },
                            selected = navIndex == i,
                            onClick = {
                                navIndex = i
                                scope.launch { drawerState.close() }
                            }
                        )
                    }
                }
            }
        ) {
            Scaffold(
                topBar = {
                    TopAppBar(
                        title = { Text("Stellarsis") },
                        navigationIcon = {
                            IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                Icon(Icons.Default.Menu, contentDescription = "菜单")
                            }
                        }
                    )
                },
                bottomBar = {
                    NavigationBar {
                        navItems.forEachIndexed { i, label ->
                            NavigationBarItem(
                                selected = navIndex == i,
                                onClick = { navIndex = i },
                                icon = { Text(if (navIndex == i) "●" else "○") },
                                label = { Text(label) },
                            )
                        }
                    }
                },
                snackbarHost = { SnackbarHost(snackState) }
            ) { padding ->
                Column(modifier = Modifier.fillMaxSize().padding(padding).padding(8.dp)) {
                    MainContent(navIndex, state, mainViewModel)
                }
            }
        }
    }
}

@Composable
private fun MainContent(
    navIndex: Int,
    state: MainUiState,
    vm: MainViewModel,
) {
    when (navIndex) {
        0 -> {
            val roomId = state.selectedRoomId
            val messages = if (roomId == null) emptyList() else state.roomMessages[roomId].orEmpty()
            val onlineCount = state.onlineUsers.size
            Column(verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(8.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(8.dp)) {
                    (state.bootstrap?.rooms ?: emptyList()).forEach { room ->
                        androidx.compose.material3.OutlinedButton(onClick = { vm.selectRoom(room) }) {
                            val unread = state.unreadChat[room.id] ?: 0
                            Text(if (unread > 0) "${room.name}($unread)" else room.name)
                        }
                    }
                }
                ChatScreen(
                    messages = messages,
                    onlineCount = onlineCount,
                    onSend = vm::sendMessage,
                    onDelete = vm::deleteChatMessage,
                    modifier = Modifier.fillMaxWidth().fillMaxSize(),
                )
            }
        }
        1 -> ForumScreen(
            sections = state.bootstrap?.sections ?: emptyList(),
            sectionDetail = state.forumSectionDetail,
            threadDetail = state.forumThreadDetail,
            onLoadSection = vm::loadForumSection,
            onLoadThread = vm::loadForumThread,
            onCreateThread = vm::createForumThread,
            onCreateReply = vm::createForumReply,
            onDeleteReply = vm::deleteForumReply,
            onDeleteThread = vm::deleteForumThread,
        )
        2 -> NotificationsScreen(
            itemsData = state.notifications,
            onRead = vm::markNotificationRead,
            onReadAll = vm::markAllNotificationsRead,
        )
        3 -> UploadsScreen(
            uploads = state.uploads,
            onUploadImage = vm::uploadImage,
            onUploadFile = vm::uploadFile,
            onDeleteUploaded = vm::deleteUploaded,
        )
        else -> SettingsScreen(
            user = state.bootstrap?.user,
            uploadQuota = state.uploadQuota,
            following = state.following,
            uploads = state.uploads,
            onToggleFollow = vm::toggleFollow,
            onDeleteUploaded = vm::deleteUploaded,
            onUpdateProfile = vm::updateProfile,
            onChangePassword = vm::changePassword,
            onLogout = vm::logout,
        )
    }
}
