// Load environment variables with proper priority (system > .env)
import('./scripts/load-env.cjs');

// Bundle ID format: space.manus.<project_name_dots>.<timestamp>
const rawBundleId = "space.manus.urea.delivery.tracker.t20260206145742";
const bundleId =
  rawBundleId
    .replace(/[-_]/g, ".")
    .replace(/[^a-zA-Z0-9.]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .toLowerCase()
    .split(".")
    .map((segment) => {
      return /^[a-zA-Z]/.test(segment) ? segment : "x" + segment;
    })
    .join(".") || "space.manus.app";

const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  appName: "Livraison Urée",
  appSlug: "urea-delivery-tracker",
  logoUrl: "https://private-us-east-1.manuscdn.com/sessionFile/dpGEUEdBQZclpI0GNU1Lij/sandbox/0P4WDtwPiEVJIgjtQSN4g9-img-1_1770407940000_na1fn_dXJlYS1kZWxpdmVyeS1pY29u.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvZHBHRVVFZEJRWmNscEkwR05VMUxpai9zYW5kYm94LzBQNFdEdHdQaUVWSklnanRRU040ZzktaW1nLTFfMTc3MDQwNzk0MDAwMF9uYTFmbl9kWEpsWVMxa1pXeHBkbVZ5ZVMxcFkyOXUucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=FD-HKKYEISSWhCcjhFwpQFUUNrPx7nwKIdnU2vaBEucbfBGodd3xZgPqk95yzBCpnUJs1IHAGYmrzCEoYspOGdy7pt5BjIfE6UHC-KNio77zufNeZnlxZWT8yOJDsnuOI~Rge7CCDN0~Us6kYBw3AkFW1DHgYPr~B9joHYFdlQdqOHHAibkDwOniikTf5anjVSm2vakuib7tmFHtxDdhBXdvDvjdzpxFccVXR14w1m9P6TE55XYGp5xZ-wT2IZOcaVQEP6uRXFwqkuqd03SHtL8wTjHvp2Nm-TLTQN~6moTZtDxCwAAdtJoM3fgUmUHHTfOwelGfhafN5NS1JHBIVQ__",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config = {
  updates: {
    url: "https://u.expo.dev/fdf74cfd-9ef3-4672-9314-0e1ae64be053"
  },
  runtimeVersion: {
    policy: "appVersion"
  },
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  extra: {
    eas: {
      projectId: "fdf74cfd-9ef3-4672-9314-0e1ae64be053"
    }
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-audio",
      {
        microphonePermission: "Allow $(PRODUCT_NAME ) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
    [
      "expo-updates",
      {
        enabled: true,
        checkOnLaunch: "always",
        fallbackToCacheTimeout: 0,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

module.exports = config;
