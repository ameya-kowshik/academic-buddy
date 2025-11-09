// Audio management for focus sessions
export class AudioManager {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Initialize audio context on user interaction
    if (typeof window !== 'undefined') {
      this.initializeAudioContext();
    }
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  // Enable/disable audio
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Create different tones for different events
  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.audioContext || !this.isEnabled) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;

      // Fade in and out to avoid clicks
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Error playing tone:', error);
    }
  }

  // Play focus session start sound
  playFocusStart() {
    this.createTone(800, 0.3, 'sine');
    setTimeout(() => this.createTone(1000, 0.3, 'sine'), 200);
  }

  // Play focus session end sound
  playFocusEnd() {
    this.createTone(600, 0.4, 'sine');
    setTimeout(() => this.createTone(500, 0.4, 'sine'), 200);
    setTimeout(() => this.createTone(400, 0.6, 'sine'), 400);
  }

  // Play break start sound
  playBreakStart() {
    this.createTone(400, 0.3, 'triangle');
    setTimeout(() => this.createTone(500, 0.3, 'triangle'), 150);
    setTimeout(() => this.createTone(600, 0.3, 'triangle'), 300);
  }

  // Play break end sound (back to focus)
  playBreakEnd() {
    this.createTone(1000, 0.2, 'square');
    setTimeout(() => this.createTone(1200, 0.2, 'square'), 100);
    setTimeout(() => this.createTone(1000, 0.4, 'square'), 200);
  }

  // Play warning sound (near max time)
  playWarning() {
    this.createTone(800, 0.2, 'sawtooth');
    setTimeout(() => this.createTone(600, 0.2, 'sawtooth'), 150);
    setTimeout(() => this.createTone(800, 0.2, 'sawtooth'), 300);
  }

  // Play completion sound
  playCompletion() {
    const notes = [523, 659, 784, 1047]; // C, E, G, C (major chord)
    notes.forEach((note, index) => {
      setTimeout(() => this.createTone(note, 0.5, 'sine'), index * 100);
    });
  }
}

// Notification management
export class NotificationManager {
  private isEnabled: boolean = false;
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (this.permission === 'granted') {
      this.isEnabled = true;
      return true;
    }

    if (this.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      this.isEnabled = permission === 'granted';
      return this.isEnabled;
    } catch (error) {
      console.warn('Error requesting notification permission:', error);
      return false;
    }
  }

  // Enable/disable notifications
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled && this.permission === 'granted';
  }

  // Show notification
  private showNotification(title: string, options: NotificationOptions = {}) {
    if (!this.isEnabled || this.permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    } catch (error) {
      console.warn('Error showing notification:', error);
    }
  }

  // Focus session notifications
  notifyFocusStart(duration: number) {
    this.showNotification('Focus Session Started! 🎯', {
      body: `${duration} minute focus session is now active. Stay concentrated!`,
      tag: 'focus-start'
    });
  }

  notifyFocusEnd() {
    this.showNotification('Focus Session Complete! ✅', {
      body: 'Great work! Time for a well-deserved break.',
      tag: 'focus-end'
    });
  }

  notifyBreakStart(duration: number, isLongBreak: boolean = false) {
    const type = isLongBreak ? 'Long Break' : 'Short Break';
    this.showNotification(`${type} Time! 😌`, {
      body: `Take a ${duration} minute break. Relax and recharge!`,
      tag: 'break-start'
    });
  }

  notifyBreakEnd() {
    this.showNotification('Break Over! 🚀', {
      body: 'Ready to get back to focused work?',
      tag: 'break-end'
    });
  }

  notifyMaxTimeWarning() {
    this.showNotification('Time Limit Warning! ⚠️', {
      body: 'You\'re approaching the 3-hour limit. Consider taking a break soon.',
      tag: 'time-warning'
    });
  }

  notifyMaxTimeReached() {
    this.showNotification('Time Limit Reached! 🛑', {
      body: 'You\'ve reached the 3-hour maximum. Great work! Time for a break.',
      tag: 'time-limit'
    });
  }

  // Check if notifications are supported and enabled
  get isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  get hasPermission(): boolean {
    return this.permission === 'granted';
  }

  get enabled(): boolean {
    return this.isEnabled;
  }
}

// Singleton instances
export const audioManager = new AudioManager();
export const notificationManager = new NotificationManager();