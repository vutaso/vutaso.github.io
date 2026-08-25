export const PRESETS = [
  { id: "iphone-69", platform: "App Store", name: "iPhone 6.9″", width: 1320, height: 2868 },
  { id: "iphone-67", platform: "App Store", name: "iPhone 6.7″", width: 1290, height: 2796 },
  { id: "iphone-65", platform: "App Store", name: "iPhone 6.5″", width: 1284, height: 2778 },
  { id: "iphone-55", platform: "App Store", name: "iPhone 5.5″", width: 1242, height: 2208 },
  { id: "ipad-13", platform: "App Store", name: "iPad Pro 13″", width: 2064, height: 2752 },
  { id: "ipad-129", platform: "App Store", name: "iPad Pro 12.9″", width: 2048, height: 2732 },
  { id: "play-phone", platform: "Google Play", name: "Phone", width: 1080, height: 1920 },
  { id: "play-tablet", platform: "Google Play", name: "Tablet", width: 1200, height: 1920 }
];

export function getPreset(id) {
  return PRESETS.find((preset) => preset.id === id) || PRESETS[0];
}
