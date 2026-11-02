# HADIR.GURU ProGuard Rules
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers class com.hadirguru.mts.MainActivity$* {
    *;
}
