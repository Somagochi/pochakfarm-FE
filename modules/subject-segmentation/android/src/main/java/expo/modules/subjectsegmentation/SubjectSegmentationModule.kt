package expo.modules.subjectsegmentation

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Matrix
import android.media.ExifInterface
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
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

class SubjectSegmentationModule : Module() {
  companion object {
    private const val MAX_INPUT_SIZE = 1536
    private const val MIN_CROP_SIZE = 512
    private const val CENTER_CROP_RATIO = 0.82f
    private const val MASK_TRANSPARENT_THRESHOLD = 0.2f
    private const val MASK_OPAQUE_THRESHOLD = 0.72f
  }

  private fun createSegmenter(): SubjectSegmenter {
    val options = SubjectSegmenterOptions.Builder()
      .enableForegroundConfidenceMask()
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
    val inputBitmap = try {
      loadCenterCroppedBitmap(context, Uri.parse(photoUri))
    } catch (error: Exception) {
      segmenter.close()
      promise.reject(
        "E_IMAGE_PREPARATION_FAILED",
        error.message ?: "분석할 사진을 준비하지 못했습니다.",
        error,
      )
      return
    }

    segmenter.initTask
      .continueWithTask {
        val inputImage = InputImage.fromBitmap(inputBitmap, 0)
        segmenter.process(inputImage)
      }
      .addOnSuccessListener { result ->
        try {
          val foreground = createForegroundBitmap(
            inputBitmap,
            result.foregroundConfidenceMask
              ?: throw IllegalStateException("피사체 마스크를 생성하지 못했습니다."),
          )
          val outputFile = File(context.cacheDir, "subject-${System.currentTimeMillis()}.png")

          FileOutputStream(outputFile).use { output ->
            foreground.compress(Bitmap.CompressFormat.PNG, 100, output)
          }
          foreground.recycle()

          promise.resolve(Uri.fromFile(outputFile).toString())
        } catch (error: Exception) {
          promise.reject("E_OUTPUT_FAILED", error.message ?: "결과 이미지를 저장하지 못했습니다.", error)
        } finally {
          inputBitmap.recycle()
          segmenter.close()
        }
      }
      .addOnFailureListener { error ->
        inputBitmap.recycle()
        segmenter.close()
        promise.reject(
          "E_SEGMENTATION_FAILED",
          error.message ?: "사진에서 동물을 분리하지 못했습니다.",
          error,
        )
      }
  }

  private fun loadCenterCroppedBitmap(
    context: android.content.Context,
    photoUri: Uri,
  ): Bitmap {
    val bounds = BitmapFactory.Options().apply {
      inJustDecodeBounds = true
    }
    context.contentResolver.openInputStream(photoUri).use { input ->
      requireNotNull(input) { "사진 파일을 열지 못했습니다." }
      BitmapFactory.decodeStream(input, null, bounds)
    }
    require(bounds.outWidth > 0 && bounds.outHeight > 0) {
      "사진 크기를 확인하지 못했습니다."
    }

    var sampleSize = 1
    while (
      bounds.outWidth / sampleSize > MAX_INPUT_SIZE ||
      bounds.outHeight / sampleSize > MAX_INPUT_SIZE
    ) {
      sampleSize *= 2
    }

    val decoded = context.contentResolver.openInputStream(photoUri).use { input ->
      requireNotNull(input) { "사진 파일을 열지 못했습니다." }
      BitmapFactory.decodeStream(
        input,
        null,
        BitmapFactory.Options().apply {
          inSampleSize = sampleSize
          inPreferredConfig = Bitmap.Config.ARGB_8888
        },
      )
    } ?: throw IllegalStateException("사진을 디코딩하지 못했습니다.")

    val orientation = context.contentResolver.openInputStream(photoUri).use { input ->
      requireNotNull(input) { "사진 방향을 확인하지 못했습니다." }
      ExifInterface(input).getAttributeInt(
        ExifInterface.TAG_ORIENTATION,
        ExifInterface.ORIENTATION_NORMAL,
      )
    }
    val oriented = applyExifOrientation(decoded, orientation)
    if (oriented !== decoded) {
      decoded.recycle()
    }

    val shortestSide = min(oriented.width, oriented.height)
    val cropSize = max(
      (shortestSide * CENTER_CROP_RATIO).roundToInt(),
      min(MIN_CROP_SIZE, shortestSide),
    )
    val cropLeft = (oriented.width - cropSize) / 2
    val cropTop = (oriented.height - cropSize) / 2
    val cropped = Bitmap.createBitmap(
      oriented,
      cropLeft,
      cropTop,
      cropSize,
      cropSize,
    )
    if (cropped !== oriented) {
      oriented.recycle()
    }

    return cropped
  }

  private fun applyExifOrientation(bitmap: Bitmap, orientation: Int): Bitmap {
    val matrix = Matrix()

    when (orientation) {
      ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.setScale(-1f, 1f)
      ExifInterface.ORIENTATION_ROTATE_180 -> matrix.setRotate(180f)
      ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.setScale(1f, -1f)
      ExifInterface.ORIENTATION_TRANSPOSE -> {
        matrix.setRotate(90f)
        matrix.postScale(-1f, 1f)
      }
      ExifInterface.ORIENTATION_ROTATE_90 -> matrix.setRotate(90f)
      ExifInterface.ORIENTATION_TRANSVERSE -> {
        matrix.setRotate(-90f)
        matrix.postScale(-1f, 1f)
      }
      ExifInterface.ORIENTATION_ROTATE_270 -> matrix.setRotate(-90f)
      else -> return bitmap
    }

    return Bitmap.createBitmap(
      bitmap,
      0,
      0,
      bitmap.width,
      bitmap.height,
      matrix,
      true,
    )
  }

  private fun createForegroundBitmap(
    source: Bitmap,
    confidenceMask: java.nio.FloatBuffer,
  ): Bitmap {
    val pixelCount = source.width * source.height
    require(confidenceMask.capacity() >= pixelCount) {
      "피사체 마스크 크기가 사진과 일치하지 않습니다."
    }

    val pixels = IntArray(pixelCount)
    source.getPixels(pixels, 0, source.width, 0, 0, source.width, source.height)

    for (index in pixels.indices) {
      val confidence = confidenceMask.get(index)
      val normalized = (
        (confidence - MASK_TRANSPARENT_THRESHOLD) /
          (MASK_OPAQUE_THRESHOLD - MASK_TRANSPARENT_THRESHOLD)
        ).coerceIn(0f, 1f)
      val smoothedAlpha = normalized * normalized * (3f - 2f * normalized)
      val sourceAlpha = Color.alpha(pixels[index])
      val resultAlpha = (sourceAlpha * smoothedAlpha).roundToInt()
      pixels[index] = (pixels[index] and 0x00FFFFFF) or (resultAlpha shl 24)
    }

    return Bitmap.createBitmap(
      pixels,
      source.width,
      source.height,
      Bitmap.Config.ARGB_8888,
    )
  }
}
