package com.stellarsis.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.material3.windowsizeclass.ExperimentalMaterial3WindowSizeClassApi
import androidx.compose.material3.windowsizeclass.calculateWindowSizeClass
import androidx.lifecycle.viewmodel.compose.viewModel
import com.stellarsis.mobile.ui.StellarsisApp
import com.stellarsis.mobile.ui.theme.StellarsisTheme
import com.stellarsis.mobile.viewmodel.MainViewModel

class MainActivity : ComponentActivity() {
    @OptIn(ExperimentalMaterial3WindowSizeClassApi::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val windowSizeClass = calculateWindowSizeClass(this)
            val mainViewModel: MainViewModel = viewModel()
            StellarsisTheme {
                StellarsisApp(
                    windowSizeClass = windowSizeClass,
                    mainViewModel = mainViewModel,
                )
            }
        }
    }
}
