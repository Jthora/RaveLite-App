/**
 * @format
 */

import {AppRegistry} from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';
import {ensureHydrated} from './src/storage/persistence';
import {runMigrations} from './src/storage/migrations';
import {toNotificationAction} from './src/domain/reminders/notifeeScheduler';
import {handleNotificationAction} from './src/domain/ambient/notificationActions';
import {bootTask} from './src/boot/bootTask';

// Notification buttons (Done / +5 / Skip) pressed while RaveLite is in the
// background. Notifee requires this at module scope, before rendering.
notifee.onBackgroundEvent(async event => {
  const action = toNotificationAction(event);
  if (!action) {
    return;
  }
  await ensureHydrated();
  // A button pressed on the first chime after an update can start the app
  // here, before App has migrated anything. Acting on the old shape — or
  // caching it for the rest of the session — is how an update's first
  // morning goes wrong. Once current, this returns at once.
  runMigrations();
  await handleNotificationAction(action);
});

AppRegistry.registerComponent(appName, () => App);

// After a reboot or an update, start the chimes again without waiting for
// somebody to open the app. See android/…/boot/BootReceiver.kt.
AppRegistry.registerHeadlessTask(
  'RaveLiteBoot',
  () => () => bootTask().then(() => undefined),
);
