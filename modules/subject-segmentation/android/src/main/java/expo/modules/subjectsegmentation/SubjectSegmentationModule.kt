package expo.modules.subjectsegmentation

import android.graphics.Bitmap
import android.net.Uri
import com.google.android.gms.common.moduleinstall.ModuleInstall
import com.google.android.gms.common.moduleinstall.ModuleInstallRequest
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenter
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream

class SubjectSegmentationModule : Module() {
  private fun createSegmenter(): SubjectSegmenter {
    val options = SubjectSegmenterOptions.Builder()
      .enableForegroundBitmap()
      .build()

    return SubjectSegmentation.getClient(options)
  }

  override fun definition() = ModuleDefinition {
    Name("SubjectSegmentation")

    AsyncFunction("isModelAvailable") { promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.reject("E_NO_CONTEXT", "Android 앱 컨텍스트를 사용할 수 없습니다.", null)
        return@AsyncFunction
      }

      val segmenter = createSegmenter()
      ModuleInstall.getClient(context)
        .areModulesAvailable(segmenter)
        .addOnSuccessListener { response ->
          segmenter.close()
          promise.resolve(response.areModulesAvailable())
        }
        .addOnFailureListener { error ->
          segmenter.close()
          promise.reject("E_MODEL_CHECK_FAILED", "ML Kit 모델 상태를 확인하지 못했습니다.", error)
        }
    }

    AsyncFunction("removeBackground") { photoUri: String, promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.reject("E_NO_CONTEXT", "Android 앱 컨텍스트를 사용할 수 없습니다.", null)
        return@AsyncFunction
      }

      val segmenter = createSegmenter()
      val moduleInstallClient = ModuleInstall.getClient(context)

      moduleInstallClient.areModulesAvailable(segmenter)
        .addOnSuccessListener { availability ->
          if (availability.areModulesAvailable()) {
            processImage(context, segmenter, photoUri, promise)
            return@addOnSuccessListener
          }

          val request = ModuleInstallRequest.newBuilder()
            .addApi(segmenter)
            .build()

          moduleInstallClient.installModules(request)
            .addOnSuccessListener {
              processImage(context, segmenter, photoUri, promise)
            }
            .addOnFailureListener { error ->
              segmenter.close()
              promise.reject(
                "E_MODEL_DOWNLOAD_FAILED",
                "ML Kit 모델을 다운로드하지 못했습니다. 네트워크 연결을 확인해 주세요.",
                error,
              )
            }
        }
        .addOnFailureListener { error ->
          segmenter.close()
          promise.reject("E_MODEL_CHECK_FAILED", "ML Kit 모델 상태를 확인하지 못했습니다.", error)
        }
    }
  }

  private fun processImage(
    context: android.content.Context,
    segmenter: SubjectSegmenter,
    photoUri: String,
    promise: Promise,
  ) {
    segmenter.initTask
      .continueWithTask {
        val inputImage = InputImage.fromFilePath(context, Uri.parse(photoUri))
        segmenter.process(inputImage)
      }
      .addOnSuccessListener { result ->
        try {
          val foreground = result.foregroundBitmap
            ?: throw IllegalStateException("분리할 피사체를 찾지 못했습니다.")
          val outputFile = File(context.cacheDir, "subject-${System.currentTimeMillis()}.png")

          FileOutputStream(outputFile).use { output ->
            foreground.compress(Bitmap.CompressFormat.PNG, 100, output)
          }

          promise.resolve(Uri.fromFile(outputFile).toString())
        } catch (error: Exception) {
          promise.reject("E_OUTPUT_FAILED", error.message ?: "결과 이미지를 저장하지 못했습니다.", error)
        } finally {
          segmenter.close()
        }
      }
      .addOnFailureListener { error ->
        segmenter.close()
        promise.reject(
          "E_SEGMENTATION_FAILED",
          error.message ?: "사진에서 동물을 분리하지 못했습니다.",
          error,
        )
      }
  }
}
