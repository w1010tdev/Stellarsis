package com.stellarsis.mobile.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.stellarsis.mobile.data.UploadedFileItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File

@Composable
fun UploadsScreen(
    uploads: List<UploadedFileItem>,
    onUploadImage: (File) -> Unit,
    onUploadFile: (File) -> Unit,
    onDeleteUploaded: (Int) -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    fun copyToTemp(uri: Uri, prefix: String): File? {
        return try {
            val input = context.contentResolver.openInputStream(uri) ?: return null
            val temp = File.createTempFile(prefix, ".bin", context.cacheDir)
            input.use { ins -> temp.outputStream().use { outs -> ins.copyTo(outs) } }
            temp
        } catch (_: Exception) { null }
    }

    val pickImage = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            scope.launch {
                val file = withContext(Dispatchers.IO) { copyToTemp(uri, "img_upload") }
                if (file != null) onUploadImage(file)
            }
        }
    }

    val pickFile = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) {
            scope.launch {
                val file = withContext(Dispatchers.IO) { copyToTemp(uri, "file_upload") }
                if (file != null) onUploadFile(file)
            }
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Button(onClick = { pickImage.launch("image/*") }, modifier = Modifier.fillMaxWidth()) { Text("上传图片") }
        Button(onClick = { pickFile.launch("*/*") }, modifier = Modifier.fillMaxWidth()) { Text("上传文件") }

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
            items(uploads, key = { it.id }) { up ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(up.filename)
                        Text(up.uploaded)
                        Button(onClick = { onDeleteUploaded(up.id) }) { Text("删除") }
                    }
                }
            }
        }
    }
}
