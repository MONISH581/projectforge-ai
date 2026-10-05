import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar as RNStatusBar,
  Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

const DEFAULT_URL = 'http://192.168.1.4:5000';

export default function App() {
  const [targetUrl, setTargetUrl] = useState(DEFAULT_URL);
  const [inputUrl, setInputUrl] = useState(DEFAULT_URL);
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const webViewRef = useRef(null);

  const handleApplyUrl = () => {
    let clean = inputUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'http://' + clean;
    }
    setTargetUrl(clean);
    setShowConfig(false);
    setLoadError(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Top Mobile Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>ProjectForge AI</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Expo Go</Text>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => webViewRef.current?.reload()}
          >
            <Text style={styles.btnText}>↻ Reload</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => setShowConfig(!showConfig)}
          >
            <Text style={styles.btnText}>{showConfig ? 'Close' : '⚙ Server'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Server URL Config Bar */}
      {showConfig && (
        <View style={styles.configBar}>
          <Text style={styles.configLabel}>Target Backend / Web Server URL:</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="http://192.168.1.4:5000"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.btnApply} onPress={handleApplyUrl}>
              <Text style={styles.btnApplyText}>Connect</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Main WebView */}
      <View style={styles.webContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: targetUrl }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsBackForwardNavigationGestures={true}
          onLoadStart={() => {
            setLoading(true);
            setLoadError(false);
          }}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setLoadError(true);
          }}
        />

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Connecting to ProjectForge AI...</Text>
            <Text style={styles.loadingSubtext}>{targetUrl}</Text>
          </View>
        )}

        {loadError && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorTitle}>Connection Notice</Text>
            <Text style={styles.errorMsg}>
              Could not connect to {targetUrl}.{'\n\n'}
              1. Ensure the ProjectForge backend is running on your PC:{'\n'}
              npm run start --prefix server{'\n\n'}
              2. Make sure your phone and PC are on the same Wi-Fi network.
            </Text>
            <TouchableOpacity
              style={styles.btnRetry}
              onPress={() => webViewRef.current?.reload()}
            >
              <Text style={styles.btnRetryText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  topBar: {
    height: 48,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    backgroundColor: '#4338ca',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    color: '#e0e7ff',
    fontSize: 10,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnSecondary: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnPrimary: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  configBar: {
    backgroundColor: '#090d16',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  configLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#ffffff',
    fontSize: 12,
  },
  btnApply: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
  },
  btnApplyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  webContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#020617',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingSubtext: {
    color: '#64748b',
    fontSize: 12,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    color: '#f87171',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorMsg: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  btnRetry: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnRetryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
