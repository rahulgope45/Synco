import { useEffect } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSpikeStore } from '../state/spike-store';

export function StatusScreen() {
  const state = useSpikeStore();
  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      if (next !== 'active') void useSpikeStore.getState().disconnect();
    });
    return () => { subscription.remove(); void useSpikeStore.getState().disconnect(); };
  }, []);
  const status = state.connected ? (state.ready ? 'Clock ready' : 'Measuring clock') : 'Disconnected';
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>SYNCO / PHASE 0</Text>
      <Text style={styles.title}>Hear the first beat.</Text>
      <Text style={styles.body}>A device test for scheduled audio and clock sync.</Text>
      <View style={styles.card}>
        <Text style={styles.label}>LOCAL AUDIO</Text>
        <Text style={styles.body}>{state.audio}</Text>
        <Action label="Play 8 clicks in 2 seconds" disabled={state.busy} onPress={() => { void state.localClick(); }} />
        <Action label="Stop clicks" onPress={state.stopAudio} />
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>CLOCK TEST</Text>
        <Text style={styles.status}>{status}</Text>
        <Text style={styles.body}>RTT: {metric(state.rttMs)} / Offset: {metric(state.offsetMs)}</Text>
        <Text style={styles.note}>Uses the computer test host through ADB. This is not the phone-to-phone hotspot test.</Text>
        <Action label={state.connected ? 'Disconnect test host' : 'Connect test host'} disabled={state.busy} onPress={() => { void (state.connected ? state.disconnect() : state.connect()); }} />
      </View>
      {state.error && <Text accessibilityRole="alert" style={styles.error}>{state.error}</Text>}
      <Text style={styles.note}>Keep the app open. Backgrounding stops this experiment. Audible alignment is unmeasured; a low RTT does not prove synchronized sound.</Text>
    </ScrollView>
  );
}
function metric(value: number | null): string { return value === null ? '--' : `${value.toFixed(1)} ms`; }
function Action({ label, disabled = false, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.button, disabled && styles.disabled]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#101619' },
  container: { padding: 24, paddingTop: 64, paddingBottom: 48 },
  eyebrow: { color: '#8de4ba', fontSize: 12, letterSpacing: 2, marginBottom: 18 },
  title: { color: '#f3f6f4', fontSize: 36, fontWeight: '700', marginBottom: 12 },
  body: { color: '#bdcac4', fontSize: 16, lineHeight: 24 },
  card: { backgroundColor: '#1d2925', borderRadius: 18, padding: 20, marginTop: 20 },
  label: { color: '#9fb2a9', fontSize: 12, letterSpacing: 2, marginBottom: 10 },
  status: { color: '#f3f6f4', fontSize: 24, marginBottom: 12 },
  note: { color: '#9fb2a9', fontSize: 13, lineHeight: 20, marginTop: 12 },
  button: { backgroundColor: '#8de4ba', borderRadius: 10, minHeight: 48, justifyContent: 'center', padding: 12, marginTop: 12 },
  buttonText: { color: '#101619', fontWeight: '600', textAlign: 'center' },
  disabled: { opacity: 0.45 },
  error: { color: '#ffb1a8', marginTop: 16, lineHeight: 22 },
});
