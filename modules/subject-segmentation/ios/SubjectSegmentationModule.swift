import ExpoModulesCore
import VisionKit

public final class SubjectSegmentationModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SubjectSegmentation")

    AsyncFunction("isModelAvailable") { () -> Bool in
      guard #available(iOS 17.0, *) else {
        return false
      }

      return ImageAnalyzer.isSupported
    }
    .runOnQueue(.main)

    AsyncFunction("removeBackground") { (photoUri: String) async throws -> String in
      guard #available(iOS 17.0, *) else {
        throw SubjectSegmentationException(
          code: "E_UNSUPPORTED_IOS_VERSION",
          message: "동물 배경 분리는 iOS 17 이상에서 지원합니다."
        )
      }

      guard ImageAnalyzer.isSupported else {
        throw SubjectSegmentationException(
          code: "E_UNSUPPORTED_DEVICE",
          message: "이 기기는 이미지 피사체 분리를 지원하지 않습니다."
        )
      }

      do {
        return try await SubjectLifter.liftSubjects(from: photoUri)
      } catch let error as SubjectLiftingError {
        throw SubjectSegmentationException(
          code: error.code,
          message: error.localizedDescription,
          cause: error
        )
      }
    }
  }
}

private struct SubjectSegmentationException: CodedError {
  let code: String
  let message: String
  let cause: Error?

  var description: String {
    guard let cause else {
      return message
    }

    return "\(message)\n→ Caused by: \(cause.localizedDescription)"
  }

  init(code: String, message: String, cause: Error? = nil) {
    self.code = code
    self.message = message
    self.cause = cause
  }
}
