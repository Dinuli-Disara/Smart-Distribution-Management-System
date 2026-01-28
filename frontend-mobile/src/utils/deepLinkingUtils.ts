// src/utils/deepLinkingUtils.ts
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Platform } from 'react-native';

export class DeepLinkingUtils {
  static SCHEME = 'manjuladms';
  static HOST = 'reset';
  static DOMAIN = 'manjula-dms.com'; // Your actual domain

  // Generate reset links for emails
  static generateResetLinks(token: string): { appLink: string; webLink: string } {
    const appLink = `${this.SCHEME}://${this.HOST}/${token}`;
    const webLink = `https://${this.DOMAIN}/reset-password?token=${encodeURIComponent(token)}`;
    
    return { appLink, webLink };
  }

  // Open a link, trying app first, then browser
  static async openLink(url: string): Promise<void> {
    try {
      // First try to open in app
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web browser
        await WebBrowser.openBrowserAsync(url);
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', 'Could not open the link');
    }
  }

  // Handle reset password links
  static async handleResetPasswordLink(token: string): Promise<void> {
    // Create the app deep link
    const appLink = `${this.SCHEME}://${this.HOST}/${token}`;
    
    try {
      const canOpen = await Linking.canOpenURL(appLink);
      
      if (canOpen) {
        await Linking.openURL(appLink);
      } else {
        // App not installed, open web version
        const webLink = `https://${this.DOMAIN}/reset-password?token=${encodeURIComponent(token)}`;
        await WebBrowser.openBrowserAsync(webLink);
        
        // Show message about installing app
        Alert.alert(
          'Open in App',
          'For better experience, install the Manjula DMS app',
          [
            { text: 'OK' },
            { text: 'Learn More', onPress: () => this.openLink('https://your-app-store-link.com') }
          ]
        );
      }
    } catch (error) {
      console.error('Error handling reset link:', error);
    }
  }

  // Test deep linking (development only)
  static testDeepLinking(): void {
    const testToken = 'test-token-123';
    const testLink = this.generateResetLinks(testToken);
    
    console.log('Test App Link:', testLink.appLink);
    console.log('Test Web Link:', testLink.webLink);
    
    if (__DEV__) {
      Alert.alert(
        'Test Deep Link',
        `App: ${testLink.appLink}\n\nWeb: ${testLink.webLink}`,
        [
          { text: 'Copy App Link', onPress: () => this.copyToClipboard(testLink.appLink) },
          { text: 'Test in App', onPress: () => this.openLink(testLink.appLink) },
          { text: 'Cancel' }
        ]
      );
    }
  }

  private static async copyToClipboard(text: string): Promise<void> {
    // You'll need to install expo-clipboard for this
    // import * as Clipboard from 'expo-clipboard';
    // await Clipboard.setStringAsync(text);
    console.log('Would copy to clipboard:', text);
  }
}