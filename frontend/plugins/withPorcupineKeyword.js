/**
 * Expo Config Plugin — Bundle Porcupine .ppn keyword files into iOS app
 *
 * Copies .ppn wake word models from assets/ into the Xcode project and adds
 * them to the "Copy Bundle Resources" build phase so Porcupine can find them
 * at runtime via the main bundle path.
 *
 * Survives `npx expo prebuild --clean` — no manual Xcode edits needed.
 *
 * We bypass the xcode library's addResourceFile() because Expo-generated
 * projects lack a "Resources" PBX group and the path resolution is wrong.
 * Instead we use lower-level APIs to add the file correctly.
 *
 * Usage in app.json:
 *   "plugins": [
 *     ["./plugins/withPorcupineKeyword", {
 *       "keywords": ["hey-my-low_en_ios_v4_0_0.ppn"]
 *     }]
 *   ]
 */
const {
  withXcodeProject,
  withPodfileProperties,
} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withPorcupineKeyword(config, props = {}) {
  const keywords = props.keywords || ['hey-my-low_en_ios_v4_0_0.ppn'];

  // 1. Set iOS deployment target to 16.0 (Porcupine v4 requires it)
  config = withPodfileProperties(config, (config) => {
    config.modResults['ios.deploymentTarget'] = '16.0';
    console.log('[withPorcupineKeyword] Set iOS deployment target to 16.0');
    return config;
  });

  // 2. Copy .ppn files into Xcode project and add to bundle resources
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const projectName = config.modRequest.projectName;
    const iosProjectPath = path.join(projectRoot, 'ios', projectName);

    for (const keyword of keywords) {
      const srcPath = path.join(projectRoot, 'assets', keyword);
      const dstPath = path.join(iosProjectPath, keyword);

      // 1. Copy the .ppn file into the Xcode project directory
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, dstPath);
        console.log(`[withPorcupineKeyword] Copied ${keyword} → ios/${projectName}/`);
      } else {
        console.warn(`[withPorcupineKeyword] ⚠️  ${keyword} not found at ${srcPath}`);
        continue;
      }

      // 2. Add file reference with the correct path (relative to ios/ root)
      //    Other Expo files use e.g. "MYPAiOSApp/SplashScreen.storyboard"
      const filePath = `${projectName}/${keyword}`;
      const fileRefUuid = xcodeProject.generateUuid();
      const buildFileUuid = xcodeProject.generateUuid();

      // PBXFileReference — tells Xcode where the file lives
      xcodeProject.addToPbxFileReferenceSection({
        uuid: fileRefUuid,
        fileRef: fileRefUuid,
        basename: keyword,
        path: filePath,
        sourceTree: '"<group>"',
        lastKnownFileType: 'file',
        group: 'Resources',
      });

      // PBXBuildFile — marks the file for inclusion in a build phase
      xcodeProject.addToPbxBuildFileSection({
        uuid: buildFileUuid,
        fileRef: fileRefUuid,
        basename: keyword,
        group: 'Resources',
      });

      // PBXResourcesBuildPhase — adds to "Copy Bundle Resources"
      xcodeProject.addToPbxResourcesBuildPhase({
        uuid: buildFileUuid,
        fileRef: fileRefUuid,
        basename: keyword,
        group: 'Resources',
      });

      // Add to the main project group so it appears in Xcode navigator
      const mainGroupKey = xcodeProject.getFirstProject().firstProject.mainGroup;
      xcodeProject.addToPbxGroup(
        { uuid: fileRefUuid, fileRef: fileRefUuid, basename: keyword },
        mainGroupKey
      );

      console.log(`[withPorcupineKeyword] Added ${keyword} to bundle resources (path: ${filePath})`);
    }

    return config;
  });

  return config;
}

module.exports = withPorcupineKeyword;
