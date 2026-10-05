package expo.modules.syncohost

import android.Manifest
import android.app.*
import android.content.*
import android.content.pm.PackageManager
import android.media.*
import android.media.projection.*
import android.os.*
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.abs

// UID-scoped internal audio: a bounded compatibility probe or opt-in live sharing.
class CaptureProbeModule : Module() {
  private fun keepScreenAwake() {
    appContext.currentActivity?.let { activity ->
      activity.runOnUiThread { activity.window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) }
    }
  }
  override fun definition() = ModuleDefinition {
    Name("CaptureProbe")
    Events("onCaptureEnded")
    OnCreate {
      CaptureProbeService.emit = { name, value -> sendEvent(name, value) }
      keepScreenAwake()
    }
    OnActivityEntersForeground { keepScreenAwake() }
    OnDestroy {
      CaptureProbeService.emit = null
      appContext.reactContext?.let { it.stopService(Intent(it, CaptureProbeService::class.java)) }
    }
    Function("status") { CaptureProbeService.status }
    Function("start") { stream: Boolean ->
      check(Build.VERSION.SDK_INT >= 29) { "Playback capture needs Android 10 or later" }
      val activity = appContext.currentActivity ?: error("Open Synco first")
      activity.packageManager.getApplicationInfo(SOURCE, 0)
      check(CaptureProbeService.status["running"] != true) { "Probe already running" }
      CaptureProbeService.status = mapOf("running" to true, "message" to "Approve Android audio capture", "peak" to 0, "samples" to 0L)
      activity.startActivity(Intent(activity, CaptureConsentActivity::class.java).putExtra("stream", stream))
    }
    Function("stop") {
      appContext.reactContext?.let { it.stopService(Intent(it, CaptureProbeService::class.java)) }
    }
  }
  companion object { const val SOURCE = "app.revanced.android.apps.youtube.music" }
}

class CaptureConsentActivity : Activity() {
  override fun onCreate(state: Bundle?) {
    super.onCreate(state)
    if (state != null) { finish(); return }
    if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), 71)
    } else consent()
  }
  override fun onRequestPermissionsResult(code: Int, permissions: Array<out String>, results: IntArray) {
    super.onRequestPermissionsResult(code, permissions, results)
    if (code == 71 && results.firstOrNull() == PackageManager.PERMISSION_GRANTED) consent()
    else { CaptureProbeService.fail("Audio permission denied"); CaptureProbeService.emit?.invoke("onCaptureEnded", emptyMap()); finish() }
  }
  private fun consent() {
    val manager = getSystemService(MediaProjectionManager::class.java)
    @Suppress("DEPRECATION")
    startActivityForResult(manager.createScreenCaptureIntent(), 72)
  }
  @Deprecated("Activity result bridge")
  override fun onActivityResult(request: Int, result: Int, data: Intent?) {
    super.onActivityResult(request, result, data)
    if (request == 72 && result == RESULT_OK && data != null) {
      startForegroundService(Intent(this, CaptureProbeService::class.java).putExtra("consent", data).putExtra("stream", intent.getBooleanExtra("stream", false)))
    } else { CaptureProbeService.fail("Capture cancelled"); CaptureProbeService.emit?.invoke("onCaptureEnded", emptyMap()) }
    finish()
  }
}

class CaptureProbeService : Service() {
  private var projection: MediaProjection? = null
  private var recorder: AudioRecord? = null
  @Volatile private var active = false
  private var worker: Thread? = null
  override fun onBind(intent: Intent?) = null
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == "STOP") { stopSelf(); return START_NOT_STICKY }
    if (active) return START_NOT_STICKY
    val stream = intent?.getBooleanExtra("stream", false) == true
    val manager = getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel("synco-capture", "Synco audio capture", NotificationManager.IMPORTANCE_LOW))
    val stop = PendingIntent.getService(this, 0, Intent(this, CaptureProbeService::class.java).setAction("STOP"), PendingIntent.FLAG_IMMUTABLE)
    startForeground(42, Notification.Builder(this, "synco-capture")
      .setSmallIcon(android.R.drawable.ic_media_play).setContentTitle(if (stream) "Synco is sharing music audio" else "Synco compatibility test")
      .setContentText(if (stream) "Internal music audio shared with joined phones. Tap Stop to end." else "Checking music audio for 30 seconds. No audio saved.")
      .addAction(Notification.Action.Builder(null, "Stop", stop).build()).build())
    try {
      @Suppress("DEPRECATION")
      val data = intent?.getParcelableExtra<Intent>("consent") ?: error("Missing capture consent")
      val mediaProjection = getSystemService(MediaProjectionManager::class.java).getMediaProjection(Activity.RESULT_OK, data)
        ?: error("Capture permission unavailable")
      projection = mediaProjection
      mediaProjection.registerCallback(object : MediaProjection.Callback() {
        override fun onStop() { active = false; stopSelf() }
      }, Handler(Looper.getMainLooper()))
      val uid = packageManager.getApplicationInfo(CaptureProbeModule.SOURCE, 0).uid
      val config = AudioPlaybackCaptureConfiguration.Builder(mediaProjection)
        .addMatchingUid(uid).addMatchingUsage(AudioAttributes.USAGE_MEDIA)
        .addMatchingUsage(AudioAttributes.USAGE_UNKNOWN).build()
      val format = AudioFormat.Builder().setSampleRate(48000).setEncoding(AudioFormat.ENCODING_PCM_16BIT)
        .setChannelMask(AudioFormat.CHANNEL_IN_MONO).build()
      val min = AudioRecord.getMinBufferSize(48000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
      check(min > 0) { "Unsupported capture format" }
      val audio = AudioRecord.Builder().setAudioFormat(format).setBufferSizeInBytes(maxOf(min * 2, 19200))
        .setAudioPlaybackCaptureConfig(config).build()
      recorder = audio
      check(audio.state == AudioRecord.STATE_INITIALIZED) { "Capture did not initialize" }
      audio.startRecording(); active = true
      status = mapOf("running" to true, "message" to "Play music now — checking internal audio", "peak" to 0, "samples" to 0L)
      worker = Thread {
        val buffer = ShortArray(960)
        var sequence = 0L
        var samples = 0L; var nonzero = 0L; var peak = 0
        val end = if (stream) Long.MAX_VALUE else SystemClock.elapsedRealtime() + 30000
        try {
          while (active && SystemClock.elapsedRealtime() < end) {
            val count = audio.read(buffer, 0, buffer.size, AudioRecord.READ_BLOCKING)
            if (count < 0) error("Capture read failed ($count)")
            for (i in 0 until count) { val level = abs(buffer[i].toInt()); if (level > 0) nonzero++; peak = maxOf(peak, level) }
            samples += count
            if (stream && count == buffer.size) {
              val bytes = java.nio.ByteBuffer.allocate(count * 2).order(java.nio.ByteOrder.LITTLE_ENDIAN)
              bytes.asShortBuffer().put(buffer)
              frameSink?.invoke(bytes.array(), sequence++, samples - count)
            }
            status = mapOf("running" to true, "message" to if (nonzero > 0) "Internal music audio detected" else "Waiting for capturable music", "peak" to peak, "samples" to samples)
          }
          status = mapOf("running" to false, "message" to if (nonzero > 0) "Capture passed: internal music audio detected" else "No audio detected: check playback or capture restrictions", "peak" to peak, "samples" to samples)
        } catch (error: Exception) { if (active) fail(error.message ?: "Capture failed") }
        finally { active = false; stopSelf() }
      }.also { it.start() }
    } catch (error: Exception) { fail(error.message ?: "Capture failed"); stopSelf() }
    return START_NOT_STICKY
  }
  override fun onDestroy() {
    active = false
    try { recorder?.stop() } catch (_: Exception) {}
    worker?.join(1000); recorder?.release(); recorder = null
    projection?.stop(); projection = null
    emit?.invoke("onCaptureEnded", emptyMap())
    if (status["running"] == true) status = status + mapOf("running" to false, "message" to "Capture stopped")
    super.onDestroy()
  }
  companion object {
    @Volatile var status: Map<String, Any> = mapOf("running" to false, "message" to "Ready to test installed music app", "peak" to 0, "samples" to 0L)
    @Volatile var emit: ((String, Map<String, Any>) -> Unit)? = null
    @Volatile var frameSink: ((ByteArray, Long, Long) -> Unit)? = null
    fun fail(message: String) { status = mapOf("running" to false, "message" to message, "peak" to 0, "samples" to 0L) }
  }
}
