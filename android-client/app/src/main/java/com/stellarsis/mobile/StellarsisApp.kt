package com.stellarsis.mobile

import android.app.Application
import androidx.work.Configuration

class StellarsisApp : Application(), Configuration.Provider {
    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder().setMinimumLoggingLevel(android.util.Log.INFO).build()
}
