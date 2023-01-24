import Ember from 'ember';
import EventManagerService from 'ember-user-activity/services/-private/event-manager';
import { inject as injectService } from '@ember/service';
import { cancel, debounce } from '@ember/runloop';
import { set } from '@ember/object';

export default class UserIdleService extends EventManagerService {
  @injectService('ember-user-activity@user-activity')
  userActivity;

  _debouncedTimeout = null;
  activeEvents = ['userActive'];
  IDLE_TIMEOUT = 600000; // 10 minutes
  isIdle = false;

  _setupListeners(method) {
    this.activeEvents.forEach((event) => {
      this.userActivity[method](event, this, this.resetTimeout);
    });
  }

  init() {
    super.init(...arguments);

    if (Ember.testing) {
      // Shorter debounce in testing mode
      set(this, 'IDLE_TIMEOUT', 10);
    }
    this._setupListeners('on');
    this.resetTimeout();
  }

  willDestroy() {
    this._setupListeners('off');
    if (this._debouncedTimeout) {
      cancel(this._debouncedTimeout);
    }

    super.willDestroy(...arguments);
  }

  resetTimeout() {
    let oldIdle = this.isIdle;
    set(this, 'isIdle', false);
    if (oldIdle) {
      this.trigger('idleChanged', false);
    }
    this._debouncedTimeout = debounce(this, this.setIdle, this.IDLE_TIMEOUT);
  }

  setIdle() {
    if (this.isDestroyed) {
      return;
    }
    set(this, 'isIdle', true);
    this.trigger('idleChanged', true);
  }
}
