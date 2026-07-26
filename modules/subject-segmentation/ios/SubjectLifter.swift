import Foundation
import UIKit
import VisionKit

enum SubjectLiftingError: LocalizedError {
  case invalidPhotoUri
  case imageDecodeFailed
  case analysisFailed(Error)
  case subjectNotFound
  case subjectLiftFailed(Error)
  case pngEncodingFailed
  case outputWriteFailed(Error)

  var code: String {
    switch self {
    case .invalidPhotoUri:
      return "E_INVALID_PHOTO_URI"
    case .imageDecodeFailed:
      return "E_IMAGE_DECODE_FAILED"
    case .analysisFailed:
      return "E_ANALYSIS_FAILED"
    case .subjectNotFound:
      return "E_SUBJECT_NOT_FOUND"
    case .subjectLiftFailed:
      return "E_SUBJECT_LIFT_FAILED"
    case .pngEncodingFailed, .outputWriteFailed:
      return "E_OUTPUT_FAILED"
    }
  }

  var errorDescription: String? {
    switch self {
    case .invalidPhotoUri:
      return "지원하지 않는 사진 경로입니다."
    case .imageDecodeFailed:
      return "사진을 불러오지 못했습니다."
    case .analysisFailed:
      return "사진에서 피사체를 분석하지 못했습니다."
    case .subjectNotFound:
      return "사진에서 분리할 피사체를 찾지 못했습니다."
    case .subjectLiftFailed:
      return "사진에서 피사체를 분리하지 못했습니다."
    case .pngEncodingFailed:
      return "분리된 사진을 PNG로 변환하지 못했습니다."
    case .outputWriteFailed:
      return "분리된 사진을 저장하지 못했습니다."
    }
  }
}

@available(iOS 17.0, *)
@MainActor
enum SubjectLifter {
  static func liftSubjects(from photoUri: String) async throws -> String {
    guard let sourceURL = URL(string: photoUri), sourceURL.isFileURL else {
      throw SubjectLiftingError.invalidPhotoUri
    }
    guard let sourceImage = UIImage(contentsOfFile: sourceURL.path) else {
      throw SubjectLiftingError.imageDecodeFailed
    }

    let analyzer = ImageAnalyzer()
    let configuration = ImageAnalyzer.Configuration([.visualLookUp])
    let analysis: ImageAnalysis

    do {
      analysis = try await analyzer.analyze(
        sourceImage,
        configuration: configuration
      )
    } catch {
      throw SubjectLiftingError.analysisFailed(error)
    }

    let interaction = ImageAnalysisInteraction()
    interaction.preferredInteractionTypes = [.imageSubject]
    interaction.analysis = analysis

    let subjects = await interaction.subjects
    guard !subjects.isEmpty else {
      throw SubjectLiftingError.subjectNotFound
    }

    let liftedImage: UIImage
    do {
      liftedImage = try await interaction.image(for: subjects)
    } catch {
      throw SubjectLiftingError.subjectLiftFailed(error)
    }

    guard let pngData = liftedImage.pngData() else {
      throw SubjectLiftingError.pngEncodingFailed
    }

    let outputURL = FileManager.default.temporaryDirectory
      .appendingPathComponent("subject-\(UUID().uuidString)")
      .appendingPathExtension("png")

    do {
      try pngData.write(to: outputURL, options: .atomic)
    } catch {
      throw SubjectLiftingError.outputWriteFailed(error)
    }

    return outputURL.absoluteString
  }
}
