Pod::Spec.new do |s|
  s.name           = 'SubjectSegmentation'
  s.version        = '1.0.0'
  s.summary        = 'On-device subject segmentation for Pochakfarm'
  s.description    = 'Expo module that lifts image subjects with VisionKit.'
  s.license        = { :type => 'MIT' }
  s.author         = 'Pochakfarm'
  s.homepage       = 'https://github.com/Somagochi/pochakfarm-FE'
  s.platforms      = {
    :ios => '15.1'
  }
  s.swift_version  = '5.9'
  s.source         = { :git => 'https://github.com/Somagochi/pochakfarm-FE.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.swift'
end
