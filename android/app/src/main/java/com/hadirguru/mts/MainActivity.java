package com.hadirguru.mts;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Parcelable;
import android.provider.MediaStore;
import android.view.View;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import androidx.webkit.WebViewAssetLoader;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class MainActivity extends AppCompatActivity {

    private static final int REQ_PERMISSIONS = 1001;
    private static final int FILE_CHOOSER_RESULT_CODE = 2001;
    private static final String APP_URL = "https://appassets.androidplatform.net/assets/www/index.html";
    private static final String FALLBACK_URL = "file:///android_asset/www/index.html";

    private WebView mWebView;
    private SwipeRefreshLayout mSwipeRefresh;
    private ProgressBar mProgressBar;
    private WebViewAssetLoader mAssetLoader;

    private ValueCallback<Uri[]> mUploadMessage;
    private Uri mCameraCapturedUri = null;

    private GeolocationPermissions.Callback mPendingGeoCallback = null;
    private String mPendingGeoOrigin = null;

    private long mLastBackPressTime = 0;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mWebView = findViewById(R.id.webview);
        mSwipeRefresh = findViewById(R.id.swipe_refresh);
        mProgressBar = findViewById(R.id.progressBar);

        // Setup Asset Loader for secure HTTPS serving of local assets
        mAssetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        setupSwipeRefresh();
        setupWebView();
        setupBackNavigation();

        // Check and request runtime permissions if needed
        requestAppPermissions();

        // Load the HADIR.GURU app
        mWebView.loadUrl(APP_URL);
    }

    private void setupSwipeRefresh() {
        mSwipeRefresh.setColorSchemeResources(R.color.primary_brand);
        mSwipeRefresh.setProgressBackgroundColorSchemeResource(R.color.primary_dark);
        mSwipeRefresh.setOnRefreshListener(() -> {
            mWebView.clearCache(true);
            mWebView.reload();
            mSwipeRefresh.setRefreshing(false);
        });

        // Only allow swipe to refresh when webview is scrolled to the very top
        mWebView.getViewTreeObserver().addOnScrollChangedListener(() -> {
            mSwipeRefresh.setEnabled(mWebView.getScrollY() == 0);
        });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        mWebView.clearCache(true);

        WebSettings settings = mWebView.getSettings();
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse response = mAssetLoader.shouldInterceptRequest(request.getUrl());
                if (response != null) {
                    return response;
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();

                if (scheme != null && (scheme.equalsIgnoreCase("tel") ||
                        scheme.equalsIgnoreCase("mailto") ||
                        scheme.equalsIgnoreCase("whatsapp") ||
                        scheme.equalsIgnoreCase("sms"))) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                        startActivity(intent);
                        return true;
                    } catch (ActivityNotFoundException e) {
                        Toast.makeText(MainActivity.this, "Aplikasi pendukung tidak ditemukan", Toast.LENGTH_SHORT).show();
                        return true;
                    }
                }

                // If loading external HTTP/HTTPS domains (e.g. documentation, help)
                if (uri.getHost() != null && !uri.getHost().contains("appassets.androidplatform.net")) {
                    try {
                        Intent browserIntent = new Intent(Intent.ACTION_VIEW, uri);
                        startActivity(browserIntent);
                        return true;
                    } catch (Exception ignored) {
                    }
                }

                return false;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                mProgressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                mProgressBar.setVisibility(View.GONE);
                mSwipeRefresh.setRefreshing(false);
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                // If appassets host fails, fallback to standard file:/// URL
                if (failingUrl != null && failingUrl.startsWith("https://appassets.androidplatform.net")) {
                    mWebView.loadUrl(FALLBACK_URL);
                }
            }
        });

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                mProgressBar.setProgress(newProgress);
                if (newProgress == 100) {
                    mProgressBar.setVisibility(View.GONE);
                } else {
                    mProgressBar.setVisibility(View.VISIBLE);
                }
            }

            // HTML5 Geolocation Permission Handler
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_FINE_LOCATION)
                        == PackageManager.PERMISSION_GRANTED) {
                    callback.invoke(origin, true, false);
                } else {
                    mPendingGeoCallback = callback;
                    mPendingGeoOrigin = origin;
                    ActivityCompat.requestPermissions(MainActivity.this,
                            new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION},
                            REQ_PERMISSIONS);
                }
            }

            // WebRTC / Camera Permission Handler
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    request.grant(request.getResources());
                }
            }

            // File Chooser Handler (for Upload Surat Izin / Bukti Sakit / Foto)
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (mUploadMessage != null) {
                    mUploadMessage.onReceiveValue(null);
                    mUploadMessage = null;
                }
                mUploadMessage = filePathCallback;

                Intent takePictureIntent = null;
                mCameraCapturedUri = null;

                try {
                    File photoFile = createImageFile();
                    if (photoFile != null) {
                        mCameraCapturedUri = FileProvider.getUriForFile(
                                MainActivity.this,
                                getPackageName() + ".fileprovider",
                                photoFile
                        );
                        takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                        takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, mCameraCapturedUri);
                        takePictureIntent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    }
                } catch (Exception e) {
                    // Camera file creation failed, proceed with picker only
                }

                Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
                contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
                contentSelectionIntent.setType("*/*");
                String[] mimeTypes = {"image/*", "application/pdf"};
                contentSelectionIntent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);

                Intent[] intentArray;
                if (takePictureIntent != null) {
                    intentArray = new Intent[]{takePictureIntent};
                } else {
                    intentArray = new Intent[0];
                }

                Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
                chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
                chooserIntent.putExtra(Intent.EXTRA_TITLE, "Pilih Berkas atau Kamera");
                chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, intentArray);

                try {
                    startActivityForResult(chooserIntent, FILE_CHOOSER_RESULT_CODE);
                    return true;
                } catch (ActivityNotFoundException e) {
                    mUploadMessage = null;
                    Toast.makeText(MainActivity.this, "Tidak ada aplikasi untuk memilih file", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });
    }

    private File createImageFile() throws IOException {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
        String imageFileName = "HADIR_FOTO_" + timeStamp + "_";
        File storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        return File.createTempFile(imageFileName, ".jpg", storageDir);
    }

    private void setupBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (mWebView != null && mWebView.canGoBack()) {
                    mWebView.goBack();
                } else {
                    long currentTime = System.currentTimeMillis();
                    if (currentTime - mLastBackPressTime < 2000) {
                        finish();
                    } else {
                        mLastBackPressTime = currentTime;
                        Toast.makeText(MainActivity.this, "Tekan sekali lagi untuk keluar dari HADIR.GURU", Toast.LENGTH_SHORT).show();
                    }
                }
            }
        });
    }

    private void requestAppPermissions() {
        List<String> permissions = new ArrayList<>();
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.ACCESS_FINE_LOCATION);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.CAMERA);
        }

        if (!permissions.isEmpty()) {
            ActivityCompat.requestPermissions(this, permissions.toArray(new String[0]), REQ_PERMISSIONS);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_PERMISSIONS) {
            if (mPendingGeoCallback != null && mPendingGeoOrigin != null) {
                boolean granted = false;
                for (int i = 0; i < permissions.length; i++) {
                    if (permissions[i].equals(Manifest.permission.ACCESS_FINE_LOCATION) &&
                            grantResults.length > i && grantResults[i] == PackageManager.PERMISSION_GRANTED) {
                        granted = true;
                        break;
                    }
                }
                mPendingGeoCallback.invoke(mPendingGeoOrigin, granted, false);
                mPendingGeoCallback = null;
                mPendingGeoOrigin = null;
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (mUploadMessage == null) {
                super.onActivityResult(requestCode, resultCode, data);
                return;
            }

            Uri[] results = null;

            if (resultCode == RESULT_OK) {
                if (data != null && data.getData() != null) {
                    results = new Uri[]{data.getData()};
                } else if (data != null && data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                } else if (mCameraCapturedUri != null) {
                    results = new Uri[]{mCameraCapturedUri};
                }
            }

            mUploadMessage.onReceiveValue(results);
            mUploadMessage = null;
            mCameraCapturedUri = null;
            return;
        }

        super.onActivityResult(requestCode, resultCode, data);
    }
}
