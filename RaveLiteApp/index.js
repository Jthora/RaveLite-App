/**
 * @format
 */

import {AppRegistry} from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';
import {ensureHydrated} from './src/storage/persistence';
import {toNotificationAction} from './src/domain/reminders/notifeeScheduler';
import {handleNotificationAction} from './src/domain/ambient/notificationActions';

// Notification buttons (Done / +5 / Skip) pressed while RaveLite is in the
// background. Notifee requires this at module scope, before rendering.
notifee.onBackgroundEvent(async event => {
  const action = toNotificationAction(event);
  if (!action) {
    return;
  }
  await ensureHydrated();
  await handleNotificationAction(action);
});

AppRegistry.registerComponent(appName, () => App);
